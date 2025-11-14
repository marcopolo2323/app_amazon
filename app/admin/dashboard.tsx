import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { useAuthStore } from '../../stores/auth';

const { width } = Dimensions.get('window');

interface AdminStats {
  totalUsers: number;
  totalAffiliates: number;
  totalServices: number;
  totalOrders: number;
  pendingAffiliates: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1247,
    totalAffiliates: 156,
    totalServices: 892,
    totalOrders: 3421,
    pendingAffiliates: 12,
    totalRevenue: 125430.50,
    monthlyRevenue: 28750.25,
    activeUsers: 324,
  });

  const quickActions: QuickAction[] = [
    {
      id: 'manage-users',
      title: 'Gestionar Usuarios',
      description: 'Ver y administrar usuarios',
      icon: 'people-outline',
      color: '#3B82F6',
      route: '/(tabs)/home',
    },
    {
      id: 'manage-affiliates',
      title: 'Gestionar Afiliados',
      description: 'Aprobar y supervisar afiliados',
      icon: 'briefcase-outline',
      color: '#10B981',
      route: '/(tabs)/home',
    },
    {
      id: 'manage-services',
      title: 'Gestionar Servicios',
      description: 'Revisar servicios publicados',
      icon: 'construct-outline',
      color: '#F59E0B',
      route: '/(tabs)/home',
    },
    {
      id: 'view-reports',
      title: 'Reportes',
      description: 'Analytics y estadísticas',
      icon: 'analytics-outline',
      color: '#8B5CF6',
      route: '/(tabs)/home',
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app, fetch actual data from API
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  const renderWelcomeSection = () => (
    <Card style={styles.welcomeCard}>
      <View style={styles.welcomeContent}>
        <View style={styles.welcomeText}>
          <Text style={styles.welcomeTitle}>
            Panel de Administración
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Bienvenido, {user?.name}. Aquí está el resumen general del sistema.
          </Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={24} color="#EF4444" />
          <Text style={styles.adminText}>ADMIN</Text>
        </View>
      </View>
    </Card>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      {/* First Row */}
      <View style={styles.statsRow}>
        <Card style={[styles.statCard, styles.statCardSmall]}>
          <View style={styles.statContent}>
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{stats.totalUsers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Usuarios Totales</Text>
            </View>
          </View>
        </Card>

        <Card style={[styles.statCard, styles.statCardSmall]}>
          <View style={styles.statContent}>
            <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="briefcase-outline" size={24} color="#10B981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{stats.totalAffiliates}</Text>
              <Text style={styles.statLabel}>Afiliados</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Second Row */}
      <View style={styles.statsRow}>
        <Card style={[styles.statCard, styles.statCardSmall]}>
          <View style={styles.statContent}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="construct-outline" size={24} color="#F59E0B" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{stats.totalServices}</Text>
              <Text style={styles.statLabel}>Servicios</Text>
            </View>
          </View>
        </Card>

        <Card style={[styles.statCard, styles.statCardSmall]}>
          <View style={styles.statContent}>
            <View style={[styles.statIcon, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="receipt-outline" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{stats.totalOrders.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Pedidos</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Revenue Cards */}
      <View style={styles.statsRow}>
        <Card style={[styles.statCard, styles.statCardLarge]}>
          <View style={styles.statContent}>
            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="trending-up-outline" size={24} color="#059669" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>${stats.monthlyRevenue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Ingresos Este Mes</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionItem}
            onPress={() => handleQuickAction(action.route)}
            activeOpacity={0.7}
          >
            <Card style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionDescription}>{action.description}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPendingActions = () => (
    <Card style={styles.pendingCard}>
      <View style={styles.pendingHeader}>
        <Text style={styles.sectionTitle}>Acciones Pendientes</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingCount}>{stats.pendingAffiliates}</Text>
        </View>
      </View>

      <View style={styles.pendingList}>
        <TouchableOpacity style={styles.pendingItem}>
          <View style={[styles.pendingIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="person-add-outline" size={20} color="#F59E0B" />
          </View>
          <View style={styles.pendingContent}>
            <Text style={styles.pendingTitle}>Afiliados por aprobar</Text>
            <Text style={styles.pendingDescription}>
              {stats.pendingAffiliates} solicitudes esperando revisión
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.pendingItem}>
          <View style={[styles.pendingIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="flag-outline" size={20} color="#EF4444" />
          </View>
          <View style={styles.pendingContent}>
            <Text style={styles.pendingTitle}>Reportes por revisar</Text>
            <Text style={styles.pendingDescription}>
              3 reportes de usuarios pendientes
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <Screen title="Panel de Administración" safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Cargando datos administrativos...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Panel de Administración" safeArea>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderWelcomeSection()}
        {renderStatsCards()}
        {renderPendingActions()}
        {renderQuickActions()}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  welcomeCard: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#1F2937',
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    flex: 1,
    marginRight: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  adminText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 8,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    padding: 16,
  },
  statCardSmall: {
    flex: 1,
  },
  statCardLarge: {
    flex: 1,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  pendingCard: {
    padding: 20,
    marginBottom: 24,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  pendingCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingList: {
    gap: 12,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingContent: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  pendingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: (width - 48) / 2,
    marginBottom: 12,
  },
  quickActionCard: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
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
});
