import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Card from '../../components/Card';
import AdminHeader from '../../components/AdminHeader';
import { useAuthStore } from '../../stores/auth';
import { API_URL } from '../../lib/config';

const { width } = Dimensions.get('window');

interface MonthlyReport {
  month: string;
  year: number;
  totalOrders: number;
  totalRevenue: number;
  platformRevenue: number;
  affiliatePayments: number;
  newUsers: number;
  newAffiliates: number;
  newServices: number;
}

export default function AdminReportsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);

  useEffect(() => {
    loadReports();
  }, [selectedYear]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/reports/monthly?year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar reportes');

      const data = await response.json();
      setMonthlyReports(data.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: string) => {
    const months: Record<string, string> = {
      '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
      '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
      '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
    };
    return months[month] || month;
  };

  const renderYearSelector = () => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    return (
      <View style={styles.yearSelector}>
        {years.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              selectedYear === year && styles.yearButtonActive,
            ]}
            onPress={() => setSelectedYear(year)}
          >
            <Text
              style={[
                styles.yearButtonText,
                selectedYear === year && styles.yearButtonTextActive,
              ]}
            >
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSummaryCards = () => {
    const totalOrders = monthlyReports.reduce((sum, r) => sum + r.totalOrders, 0);
    const totalRevenue = monthlyReports.reduce((sum, r) => sum + r.totalRevenue, 0);
    const platformRevenue = monthlyReports.reduce((sum, r) => sum + r.platformRevenue, 0);

    return (
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Resumen Anual {selectedYear}</Text>
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="receipt-outline" size={24} color="#2563EB" />
            </View>
            <Text style={styles.summaryValue}>{totalOrders}</Text>
            <Text style={styles.summaryLabel}>Órdenes Totales</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="cash-outline" size={24} color="#10B981" />
            </View>
            <Text style={styles.summaryValue}>S/ {totalRevenue.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Ingresos Totales</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="trending-up-outline" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.summaryValue}>S/ {platformRevenue.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Comisión (5%)</Text>
          </Card>
        </View>
      </View>
    );
  };

  const renderMonthlyReport = (report: MonthlyReport) => (
    <Card key={`${report.year}-${report.month}`} style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportMonth}>
          {getMonthName(report.month)} {report.year}
        </Text>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => {
            // Navigate to detailed monthly report
          }}
        >
          <Text style={styles.detailButtonText}>Ver Detalles</Text>
          <Ionicons name="chevron-forward" size={16} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.reportStats}>
        <View style={styles.reportStat}>
          <Text style={styles.reportStatLabel}>Órdenes</Text>
          <Text style={styles.reportStatValue}>{report.totalOrders}</Text>
        </View>
        <View style={styles.reportStat}>
          <Text style={styles.reportStatLabel}>Ingresos</Text>
          <Text style={styles.reportStatValue}>S/ {report.totalRevenue.toFixed(2)}</Text>
        </View>
        <View style={styles.reportStat}>
          <Text style={styles.reportStatLabel}>Comisión</Text>
          <Text style={[styles.reportStatValue, { color: '#10B981' }]}>
            S/ {report.platformRevenue.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.reportDetails}>
        <View style={styles.reportDetailRow}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.reportDetailText}>
            {report.newUsers} nuevos usuarios
          </Text>
        </View>
        <View style={styles.reportDetailRow}>
          <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
          <Text style={styles.reportDetailText}>
            {report.newAffiliates} nuevos afiliados
          </Text>
        </View>
        <View style={styles.reportDetailRow}>
          <Ionicons name="construct-outline" size={16} color="#6B7280" />
          <Text style={styles.reportDetailText}>
            {report.newServices} nuevos servicios
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AdminHeader title="Reportes Mensuales" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AdminHeader title="Reportes Mensuales" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderYearSelector()}
        {renderSummaryCards()}

        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>Reportes por Mes</Text>
          {monthlyReports.length > 0 ? (
            monthlyReports.map(renderMonthlyReport)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No hay reportes para este año</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  yearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  yearButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  yearButtonTextActive: {
    color: '#fff',
  },
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  reportsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  reportCard: {
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportMonth: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reportStat: {
    alignItems: 'center',
  },
  reportStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  reportStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  reportDetails: {
    gap: 8,
  },
  reportDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
