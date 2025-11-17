import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { useAuthStore } from '../../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface PendingPayment {
  _id: string;
  affiliateName: string;
  affiliateEmail: string;
  totalAmount: number;
  transactionCount: number;
  bankAccount?: { bank: string; number: string };
  yapePhone?: string;
}

export default function AdminPaymentsScreen() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Form data
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'yape' | 'plin' | 'cash'>('yape');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/affiliate-payments/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar pagos pendientes');

      const data = await response.json();
      setPendingPayments(data.pendingPayments);
    } catch (error) {
      console.error('Error loading pending payments:', error);
      Alert.alert('Error', 'No se pudieron cargar los pagos pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentPress = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setPaymentMethod(payment.yapePhone ? 'yape' : 'bank_transfer');
    setReferenceNumber('');
    setNotes('');
    setModalVisible(true);
  };

  const handleCreatePayment = async () => {
    if (!selectedPayment) return;

    if (!referenceNumber.trim()) {
      Alert.alert('Error', 'Ingresa el número de referencia/operación');
      return;
    }

    setProcessing(true);
    try {
      // Primero obtener los IDs de transacciones
      const transactionIds = selectedPayment.transactionIds || [];

      const paymentData = {
        affiliateId: selectedPayment._id,
        transactionIds,
        paymentMethod,
        paymentDetails: {
          referenceNumber,
          ...(paymentMethod === 'bank_transfer' && selectedPayment.bankAccount
            ? {
                bank: selectedPayment.bankAccount.bank,
                accountNumber: selectedPayment.bankAccount.number,
              }
            : {}),
          ...(paymentMethod === 'yape' && selectedPayment.yapePhone
            ? { phone: selectedPayment.yapePhone }
            : {}),
        },
        notes,
      };

      // Crear el pago
      const createResponse = await fetch(`${API_URL}/api/affiliate-payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!createResponse.ok) throw new Error('Error al crear el pago');

      const payment = await createResponse.json();

      // Completar el pago inmediatamente
      const completeResponse = await fetch(
        `${API_URL}/api/affiliate-payments/${payment.paymentId}/complete`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes }),
        }
      );

      if (!completeResponse.ok) throw new Error('Error al completar el pago');

      Alert.alert('Éxito', 'Pago registrado correctamente');
      setModalVisible(false);
      loadPendingPayments();
    } catch (error) {
      console.error('Error creating payment:', error);
      Alert.alert('Error', 'No se pudo registrar el pago');
    } finally {
      setProcessing(false);
    }
  };

  const renderPayment = ({ item }: { item: PendingPayment }) => (
    <TouchableOpacity onPress={() => handlePaymentPress(item)}>
      <Card style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentIcon}>
            <Ionicons name="wallet-outline" size={24} color="#10B981" />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>{item.affiliateName}</Text>
            <Text style={styles.paymentEmail}>{item.affiliateEmail}</Text>
            <Text style={styles.paymentTransactions}>
              {item.transactionCount} transacciones pendientes
            </Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Monto a pagar:</Text>
          <Text style={styles.amountValue}>S/ {item.totalAmount.toFixed(2)}</Text>
        </View>

        {item.yapePhone && (
          <View style={styles.paymentMethodInfo}>
            <Ionicons name="phone-portrait-outline" size={16} color="#6B7280" />
            <Text style={styles.paymentMethodText}>Yape: {item.yapePhone}</Text>
          </View>
        )}

        {item.bankAccount && (
          <View style={styles.paymentMethodInfo}>
            <Ionicons name="card-outline" size={16} color="#6B7280" />
            <Text style={styles.paymentMethodText}>
              {item.bankAccount.bank} - {item.bankAccount.number}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.payButton}>
          <Text style={styles.payButtonText}>Registrar Pago</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Screen title="Pagos Pendientes" safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Pagos Pendientes" safeArea>
      {pendingPayments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>¡Todo al día!</Text>
          <Text style={styles.emptyText}>No hay pagos pendientes a afiliados</Text>
        </View>
      ) : (
        <FlatList
          data={pendingPayments}
          renderItem={renderPayment}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadPendingPayments}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Registrar Pago</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {selectedPayment && (
                <>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalLabel}>Afiliado:</Text>
                    <Text style={styles.modalValue}>{selectedPayment.affiliateName}</Text>
                  </View>

                  <View style={styles.modalInfo}>
                    <Text style={styles.modalLabel}>Monto:</Text>
                    <Text style={styles.modalValueAmount}>
                      S/ {selectedPayment.totalAmount.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={styles.inputLabel}>Método de pago:</Text>
                  <View style={styles.methodButtons}>
                    {selectedPayment.yapePhone && (
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          paymentMethod === 'yape' && styles.methodButtonActive,
                        ]}
                        onPress={() => setPaymentMethod('yape')}
                      >
                        <Text
                          style={[
                            styles.methodButtonText,
                            paymentMethod === 'yape' && styles.methodButtonTextActive,
                          ]}
                        >
                          Yape
                        </Text>
                      </TouchableOpacity>
                    )}
                    {selectedPayment.bankAccount && (
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          paymentMethod === 'bank_transfer' && styles.methodButtonActive,
                        ]}
                        onPress={() => setPaymentMethod('bank_transfer')}
                      >
                        <Text
                          style={[
                            styles.methodButtonText,
                            paymentMethod === 'bank_transfer' && styles.methodButtonTextActive,
                          ]}
                        >
                          Transferencia
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.methodButton,
                        paymentMethod === 'cash' && styles.methodButtonActive,
                      ]}
                      onPress={() => setPaymentMethod('cash')}
                    >
                      <Text
                        style={[
                          styles.methodButtonText,
                          paymentMethod === 'cash' && styles.methodButtonTextActive,
                        ]}
                      >
                        Efectivo
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Número de operación/referencia:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 123456789"
                    value={referenceNumber}
                    onChangeText={setReferenceNumber}
                  />

                  <Text style={styles.inputLabel}>Notas (opcional):</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Agregar notas sobre el pago..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleCreatePayment}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.submitButtonText}>Confirmar Pago</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
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
    paddingBottom: 16,
  },
  paymentCard: {
    marginBottom: 12,
    padding: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  paymentEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  paymentTransactions: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#6B7280',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalInfo: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  modalValueAmount: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#10B981',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
