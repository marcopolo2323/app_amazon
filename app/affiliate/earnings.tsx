import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import RequireAuth from '../../components/auth/RequireAuth';
import { ThemedText } from '../../components/themed-text';
import { useAuthStore } from '../../stores/auth';
import { Api } from '../../lib/api';

const { width } = Dimensions.get('window');

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  todayEarnings: number;
  pendingPayments: number;
  totalOrders: number;
  averageOrderValue: number;
  currency: string;
}

interface EarningTransaction {
  id: string;
  type: 'payment' | 'withdrawal' | 'refund';
  amount: number;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  orderId?: string;
}

interface EarningsPeriod {
  period: string;
  amount: number;
  orders: number;
  change: number; // percentage change
}

const transactionTypeConfig = {
  payment: { label: 'Pago recibido', color: '#10B981', icon: 'arrow-down-circle' },
  withdrawal: { label: 'Retiro', color: '#EF4444', icon: 'arrow-up-circle' },
  refund: { label: 'Reembolso', color: '#F59E0B', icon: 'refresh-circle' },
};

const statusConfig = {
  completed: { label: 'Completado', color: '#10B981', bg: '#D1FAE5' },
  pending: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
  failed: { label: 'Fallido', color: '#EF4444', bg: '#FEE2E2' },
};

export default function EarningsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0,
    todayEarnings: 0,
    pendingPayments: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    currency: 'USD',
  });

  // Transactions de backend
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);

  const periodsData: EarningsPeriod[] = [
    { period: 'Hoy', amount: earningsData.todayEarnings, orders: 2, change: 12.5 },
    { period: 'Esta semana', amount: earningsData.weeklyEarnings, orders: 8, change: 8.3 },
    { period: 'Este mes', amount: earningsData.monthlyEarnings, orders: 25, change: 15.7 },
    { period: 'Este año', amount: earningsData.totalEarnings, orders: 127, change: 23.2 },
  ];

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const stats = await Api.getAffiliateStats(token || '');
      // Mapear datos disponibles del backend
      const totalEarnings = stats?.totalEarnings ?? 0;
      const monthlyEarnings = stats?.monthlyEarnings ?? 0;
      const totalOrders = stats?.totalOrders ?? 0;
      const pendingPayments = stats?.pendingOrders ?? 0;

      // Derivados simples (si el backend no los provee)
      const averageOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;

      setEarningsData((prev) => ({
        ...prev,
        totalEarnings,
        monthlyEarnings,
        totalOrders,
        pendingPayments,
        averageOrderValue,
      }));

      // Cargar movimientos reales (transacciones) del afiliado
      const txs = await Api.listTransactions(token || '');
      const mapped: EarningTransaction[] = (txs || []).map((tx: any) => {
        const status = tx.status as 'completed' | 'pending' | 'refunded';
        const type: 'payment' | 'withdrawal' | 'refund' = status === 'refunded' ? 'refund' : 'payment';
        const mappedStatus: 'completed' | 'pending' | 'failed' = status === 'refunded' ? 'failed' : (status as any);
        return {
          id: tx.transactionId || String(tx._id || tx.id || ''),
          type,
          amount: Number(tx.affiliateAmount || 0),
          currency: 'USD',
          description: tx.orderId ? `Pago de orden #${tx.orderId}` : 'Movimiento',
          status: mappedStatus,
          date: tx.createdAt,
          orderId: tx.orderId,
        } as EarningTransaction;
      });
      setTransactions(mapped);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEarningsData(true);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEarningsOverview = () => (
    <Card style={styles.overviewCard}>
      <View style={styles.overviewHeader}>
        <Text style={styles.overviewTitle}>Ganancias Totales</Text>
        <TouchableOpacity style={styles.withdrawButton}>
          <Ionicons name="wallet-outline" size={16} color="#2563EB" />
          <Text style={styles.withdrawButtonText}>Retirar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.totalAmount}>
        {formatCurrency(earningsData.totalEarnings, earningsData.currency)}
      </Text>

      <View style={styles.pendingContainer}>
        <Ionicons name="time-outline" size={16} color="#F59E0B" />
        <Text style={styles.pendingText}>
          {formatCurrency(earningsData.pendingPayments, earningsData.currency)} pendiente
        </Text>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>{earningsData.totalOrders}</Text>
          <Text style={styles.quickStatLabel}>Órdenes</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>
            {formatCurrency(earningsData.monthlyEarnings, earningsData.currency)}
          </Text>
          <Text style={styles.quickStatLabel}>Este mes</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>
            {formatCurrency(earningsData.averageOrderValue, earningsData.currency)}
          </Text>
          <Text style={styles.quickStatLabel}>Ticket promedio</Text>
        </View>
      </View>
    </Card>
  );

  const renderPeriods = () => (
    <View style={styles.periodSection}>
      <ThemedText style={styles.sectionTitle}>Resumen por períodos</ThemedText>
      <View style={styles.periodsGrid}>
        {periodsData.map((p) => (
          <Card key={p.period} style={styles.periodCard}>
            <Text style={styles.periodLabel}>{p.period}</Text>
            <Text style={styles.periodAmount}>{formatCurrency(p.amount, earningsData.currency)}</Text>
            <View style={styles.periodStats}>
              <Text style={styles.periodOrders}>{p.orders} órdenes</Text>
              <View style={styles.changeContainer}>
                <Ionicons name={p.change >= 0 ? 'trending-up' : 'trending-down'} size={14} color={p.change >= 0 ? '#10B981' : '#EF4444'} />
                <Text style={[styles.changeText, { color: p.change >= 0 ? '#10B981' : '#EF4444' }]}>
                  {p.change > 0 ? '+' : ''}{p.change}%
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );

  const renderTransactions = () => (
    <View style={styles.transactionsSection}>
      <View style={styles.transactionsHeader}>
        <ThemedText style={styles.sectionTitle}>Movimientos</ThemedText>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>Ver todo</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.transactionsList}>
        {transactions.map((t) => (
          <Card key={t.id} style={styles.transactionCard}>
            <View style={styles.transactionContent}>
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: `${transactionTypeConfig[t.type].color}22` }]}>
                  <Ionicons name={transactionTypeConfig[t.type].icon as any} size={22} color={transactionTypeConfig[t.type].color} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>{transactionTypeConfig[t.type].label}</Text>
                  <Text style={styles.transactionDescription}>{t.description}</Text>
                  <Text style={styles.transactionDate}>{formatDate(t.date)}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, { color: transactionTypeConfig[t.type].color }]}>
                  {t.type === 'withdrawal' || t.type === 'refund' ? '-' : '+'}{formatCurrency(t.amount, t.currency)}
                </Text>
                <View style={[styles.transactionStatus, { backgroundColor: statusConfig[t.status].bg }]}>
                  <Text style={[styles.transactionStatusText, { color: statusConfig[t.status].color }]}>
                    {statusConfig[t.status].label}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <Screen safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <ThemedText style={styles.loadingText}>Cargando tus ganancias...</ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <RequireAuth roles={["affiliate"]}>
      <Screen title="Ganancias" subtitle="Resumen de ingresos y movimientos" safeArea scrollable>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {renderEarningsOverview()}
          {renderPeriods()}
          {renderTransactions()}
        </ScrollView>
      </Screen>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  overviewCard: {
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#1F2937',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  withdrawButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  pendingText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  periodSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  periodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  periodCard: {
    width: (width - 48) / 2,
    padding: 16,
  },
  periodLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  periodAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  periodStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodOrders: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    padding: 16,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  transactionStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});