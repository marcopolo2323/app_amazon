import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { useAuthStore } from '../../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface Order {
  id: string;
  clientName: string;
  affiliateName: string;
  serviceTitle: string;
  amount: number;
  commission: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

export default function AdminOrdersScreen() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/orders?page=${page}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar órdenes');

      const data = await response.json();
      setOrders(data.orders);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const affiliateAmount = item.amount - item.commission;
    
    return (
      <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderIcon}>
            <Ionicons name="receipt-outline" size={24} color="#2563EB" />
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle}>{item.serviceTitle}</Text>
            <Text style={styles.orderClient}>Cliente: {item.clientName}</Text>
            <Text style={styles.orderAffiliate}>Afiliado: {item.affiliateName}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={styles.detailValue}>S/ {item.amount.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Comisión (5%):</Text>
            <Text style={[styles.detailValue, styles.commission]}>
              S/ {item.commission.toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Para afiliado (95%):</Text>
            <Text style={[styles.detailValue, styles.affiliateAmount]}>
              S/ {affiliateAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Método de pago:</Text>
            <Text style={styles.detailValue}>{getPaymentMethodLabel(item.paymentMethod)}</Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
          <View style={[styles.paymentBadge, getPaymentStatusStyle(item.paymentStatus)]}>
            <Text style={styles.paymentText}>{getPaymentStatusLabel(item.paymentStatus)}</Text>
          </View>
        </View>

        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </Card>
    );
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      in_progress: 'En Progreso',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, any> = {
      pending: { backgroundColor: '#FEF3C7' },
      confirmed: { backgroundColor: '#DBEAFE' },
      in_progress: { backgroundColor: '#E0E7FF' },
      completed: { backgroundColor: '#D1FAE5' },
      cancelled: { backgroundColor: '#FEE2E2' },
    };
    return styles[status] || {};
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pago Pendiente',
      completed: 'Pagado',
      failed: 'Fallido',
    };
    return labels[status] || status;
  };

  const getPaymentStatusStyle = (status: string) => {
    const styles: Record<string, any> = {
      pending: { backgroundColor: '#FEF3C7' },
      completed: { backgroundColor: '#D1FAE5' },
      failed: { backgroundColor: '#FEE2E2' },
    };
    return styles[status] || {};
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      yape: 'Yape',
      plin: 'Plin',
      mercado_pago: 'Mercado Pago',
      bank: 'Banco',
    };
    return labels[method] || method;
  };

  if (loading && orders.length === 0) {
    return (
      <Screen title="Órdenes" safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Órdenes" safeArea>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadOrders}
      />

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <Ionicons name="chevron-back" size={20} color={page === 1 ? '#D1D5DB' : '#2563EB'} />
          </TouchableOpacity>
          <Text style={styles.pageText}>
            Página {page} de {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <Ionicons name="chevron-forward" size={20} color={page === totalPages ? '#D1D5DB' : '#2563EB'} />
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  orderCard: {
    marginBottom: 12,
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderClient: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  orderAffiliate: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  commission: {
    color: '#2563EB',
  },
  affiliateAmount: {
    color: '#10B981',
  },
  orderFooter: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
