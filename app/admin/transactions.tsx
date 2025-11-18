import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Card from '../../components/Card';
import ReceiptViewer from '../../components/ReceiptViewer';
import { useAuthStore } from '../../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface Transaction {
  _id: string;
  orderId: string;
  affiliateId: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  commission: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
}

export default function AdminTransactionsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [page]);

  const loadTransactions = async () => {
    if (!hasMore && page > 1) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/transactions?page=${page}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al cargar transacciones');
      }

      const data = await response.json();
      const transactionsList = data.transactions || [];
      
      if (page === 1) {
        setTransactions(transactionsList);
      } else {
        setTransactions(prev => [...prev, ...transactionsList]);
      }
      
      setHasMore(transactionsList.length === 20);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIcon}>
          <Ionicons 
            name={item.status === 'paid' ? 'checkmark-circle' : 'time-outline'} 
            size={24} 
            color={getStatusColor(item.status)} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.affiliateName}>{item.affiliateId.name}</Text>
          <Text style={styles.affiliateEmail}>{item.affiliateId.email}</Text>
          <Text style={styles.orderId}>Orden: {item.orderId}</Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Monto:</Text>
          <Text style={styles.amountValue}>S/ {item.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Comisión:</Text>
          <Text style={styles.commissionValue}>S/ {item.commission.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('es-PE')}
        </Text>
      </View>

      {/* Botón para ver comprobante */}
      <TouchableOpacity
        style={styles.receiptButton}
        onPress={() => {
          setSelectedTransaction(item);
          setShowReceipt(true);
        }}
      >
        <Ionicons name="receipt-outline" size={18} color="#2563EB" />
        <Text style={styles.receiptButtonText}>Ver Comprobante</Text>
      </TouchableOpacity>
    </Card>
  );

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transacciones</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transacciones</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No hay transacciones</Text>
              <Text style={styles.emptyText}>
                Las transacciones de afiliados aparecerán aquí
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator size="small" color="#2563EB" style={styles.footerLoader} />
          ) : null
        }
      />
      {/* Receipt Viewer */}
      {selectedTransaction && (
        <ReceiptViewer
          visible={showReceipt}
          type="transaction"
          receiptNumber={`TRX-${selectedTransaction._id.slice(-8).toUpperCase()}`}
          date={new Date(selectedTransaction.createdAt).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          items={[
            { label: 'Afiliado', value: selectedTransaction.affiliateId.name },
            { label: 'Email', value: selectedTransaction.affiliateId.email },
            { label: 'Orden ID', value: selectedTransaction.orderId },
            { label: 'Monto Total', value: `S/ ${selectedTransaction.amount.toFixed(2)}`, highlight: true },
            { label: 'Comisión Plataforma (5%)', value: `S/ ${selectedTransaction.commission.toFixed(2)}`, highlight: true },
            { label: 'Para Afiliado (95%)', value: `S/ ${(selectedTransaction.amount - selectedTransaction.commission).toFixed(2)}`, highlight: true },
          ]}
          total={selectedTransaction.amount}
          notes={`Estado: ${getStatusText(selectedTransaction.status)}`}
          onClose={() => setShowReceipt(false)}
          onDownload={() => {
            // Implementar descarga de PDF
            console.log('Descargar PDF');
          }}
          onShare={() => {
            // Implementar compartir
            console.log('Compartir');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  transactionCard: {
    marginBottom: 12,
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  affiliateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  affiliateEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  orderId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  amountContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  commissionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  footerLoader: {
    marginVertical: 16,
  },
});
