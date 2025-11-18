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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import DocumentViewer from '../../components/DocumentViewer';
import { useAuthStore } from '../../stores/auth';
import { API_URL } from '../../lib/config';

interface Affiliate {
  id: string;
  affiliateId: string;
  name: string;
  email: string;
  phone?: string;
  dni: string;
  status: 'pending' | 'approved' | 'rejected';
  bankAccount?: { bank: string; number: string };
  yapePhone?: string;
  documentsComplete: boolean;
  verificationNotes?: string;
  dniDocument?: string;
  createdAt: string;
}

export default function AdminAffiliatesScreen() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAffiliates();
  }, [filter]);

  const loadAffiliates = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? `${API_URL}/admin/affiliates`
        : `${API_URL}/admin/affiliates?status=${filter}`;
      
      console.log('Loading affiliates from:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Affiliates response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Affiliates error data:', errorData);
        throw new Error(errorData.error || errorData.message || 'Error al cargar afiliados');
      }

      const data = await response.json();
      console.log('Affiliates data:', data);
      setAffiliates(data.affiliates || []);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron cargar los afiliados');
    } finally {
      setLoading(false);
    }
  };

  const handleAffiliatePress = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setNotes(affiliate.verificationNotes || '');
    setModalVisible(true);
  };

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedAffiliate) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/affiliates/${selectedAffiliate.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, verificationNotes: notes }),
        }
      );

      if (!response.ok) throw new Error('Error al actualizar estado');

      Alert.alert(
        'Éxito',
        `Afiliado ${status === 'approved' ? 'aprobado' : 'rechazado'} correctamente`
      );
      setModalVisible(false);
      loadAffiliates();
    } catch (error) {
      console.error('Error updating affiliate status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del afiliado');
    } finally {
      setProcessing(false);
    }
  };

  const renderAffiliate = ({ item }: { item: Affiliate }) => (
    <Card style={styles.affiliateCard}>
      <View style={styles.affiliateHeader}>
        <View style={styles.affiliateAvatar}>
          <Ionicons name="briefcase" size={24} color="#6B7280" />
        </View>
        <View style={styles.affiliateInfo}>
          <Text style={styles.affiliateName}>{item.name}</Text>
          <Text style={styles.affiliateEmail}>{item.email}</Text>
          <Text style={styles.affiliateDni}>DNI: {item.dni}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      
      {item.bankAccount && (
        <View style={styles.bankInfo}>
          <Ionicons name="card-outline" size={16} color="#6B7280" />
          <Text style={styles.bankText}>
            {item.bankAccount.bank} - {item.bankAccount.number}
          </Text>
        </View>
      )}
      {item.yapePhone && (
        <View style={styles.bankInfo}>
          <Ionicons name="phone-portrait-outline" size={16} color="#6B7280" />
          <Text style={styles.bankText}>Yape: {item.yapePhone}</Text>
        </View>
      )}

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedAffiliate(item);
            setShowDocuments(true);
          }}
        >
          <Ionicons name="document-text-outline" size={18} color="#2563EB" />
          <Text style={styles.actionButtonText}>Ver Documentos</Text>
        </TouchableOpacity>
        
        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton]}
            onPress={() => handleAffiliatePress(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
            <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Revisar</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };
    return labels[status] || status;
  };

  const getStatusBadgeStyle = (status: string) => {
    const styles: Record<string, any> = {
      pending: { backgroundColor: '#FEF3C7' },
      approved: { backgroundColor: '#D1FAE5' },
      rejected: { backgroundColor: '#FEE2E2' },
    };
    return styles[status] || {};
  };

  if (loading && affiliates.length === 0) {
    return (
      <Screen title="Afiliados" safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Afiliados" safeArea scrollable={false}>
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todos' : getStatusLabel(f)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={affiliates}
        renderItem={renderAffiliate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadAffiliates}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Revisar Afiliado</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedAffiliate && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Nombre:</Text>
                  <Text style={styles.modalValue}>{selectedAffiliate.name}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Email:</Text>
                  <Text style={styles.modalValue}>{selectedAffiliate.email}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>DNI:</Text>
                  <Text style={styles.modalValue}>{selectedAffiliate.dni}</Text>
                </View>

                <Text style={styles.notesLabel}>Notas de verificación:</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Agregar notas sobre la verificación..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                />

                {selectedAffiliate.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleUpdateStatus('approved')}
                      disabled={processing}
                    >
                      {processing ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <Text style={styles.actionButtonText}>Aprobar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleUpdateStatus('rejected')}
                      disabled={processing}
                    >
                      {processing ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={20} color="#fff" />
                          <Text style={styles.actionButtonText}>Rechazar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Document Viewer */}
      {selectedAffiliate && (
        <DocumentViewer
          visible={showDocuments}
          documents={[
            {
              type: 'DNI',
              url: selectedAffiliate.dniDocument || 'https://via.placeholder.com/400x300?text=DNI+No+Disponible',
              label: 'Documento de Identidad (DNI)',
            },
            // Puedes agregar más documentos aquí cuando estén disponibles
          ]}
          affiliateName={selectedAffiliate.name}
          onClose={() => setShowDocuments(false)}
        />
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingBottom: 16,
  },
  affiliateCard: {
    marginBottom: 12,
    padding: 16,
  },
  affiliateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  affiliateAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  affiliateInfo: {
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
  affiliateDni: {
    fontSize: 14,
    color: '#9CA3AF',
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
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  bankText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 6,
  },
  reviewButton: {
    backgroundColor: '#F0FDF4',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
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
    maxHeight: '80%',
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
    marginBottom: 12,
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
  notesLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
