import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuthStore } from '../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface Dispute {
  disputeId: string;
  orderId: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  reporterName: string;
  reportedName: string;
  evidenceCount: number;
  messageCount: number;
  createdAt: string;
}

export default function DisputesScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, [filter]);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const url =
        filter === 'all'
          ? `${API_URL}/api/disputes`
          : `${API_URL}/api/disputes?status=${filter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar disputas');

      const data = await response.json();
      setDisputes(data.disputes);
    } catch (error) {
      console.error('Error loading disputes:', error);
      Alert.alert('Error', 'No se pudieron cargar las disputas');
    } finally {
      setLoading(false);
    }
  };

  const handleDisputePress = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setModalVisible(true);
  };

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(
        `${API_URL}/api/disputes/${selectedDispute.disputeId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (!response.ok) throw new Error('Error al enviar mensaje');

      setNewMessage('');
      Alert.alert('Éxito', 'Mensaje enviado');
      loadDisputes();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const getDisputeIcon = (type: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      service_not_delivered: 'close-circle-outline',
      poor_quality: 'thumbs-down-outline',
      payment_issue: 'wallet-outline',
      communication_issue: 'chatbubbles-outline',
      fraud: 'warning-outline',
      other: 'help-circle-outline',
    };
    return icons[type] || 'alert-circle-outline';
  };

  const getDisputeColor = (status: string) => {
    const colors: Record<string, string> = {
      open: '#EF4444',
      in_review: '#F59E0B',
      resolved: '#10B981',
      closed: '#6B7280',
      escalated: '#8B5CF6',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Abierta',
      in_review: 'En Revisión',
      resolved: 'Resuelta',
      closed: 'Cerrada',
      escalated: 'Escalada',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      service_not_delivered: 'Servicio no entregado',
      poor_quality: 'Mala calidad',
      payment_issue: 'Problema de pago',
      communication_issue: 'Problema de comunicación',
      fraud: 'Fraude',
      other: 'Otro',
    };
    return labels[type] || type;
  };

  const renderDispute = ({ item }: { item: Dispute }) => {
    const icon = getDisputeIcon(item.type);
    const color = getDisputeColor(item.status);

    return (
      <TouchableOpacity
        onPress={() => handleDisputePress(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.disputeCard}>
          <View style={styles.disputeHeader}>
            <View style={[styles.disputeIcon, { backgroundColor: `${color}15` }]}>
              <Ionicons name={icon} size={24} color={color} />
            </View>

            <View style={styles.disputeInfo}>
              <Text style={styles.disputeTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.disputeType}>{getTypeLabel(item.type)}</Text>
              <View style={styles.disputeFooter}>
                <Text style={styles.disputeDate}>
                  {new Date(item.createdAt).toLocaleDateString('es-PE')}
                </Text>
                {item.messageCount > 0 && (
                  <View style={styles.messageCount}>
                    <Ionicons name="chatbubble-outline" size={12} color="#6B7280" />
                    <Text style={styles.messageCountText}>{item.messageCount}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: `${color}15` }]}>
              <Text style={[styles.statusText, { color }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <Screen title="Disputas" safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Disputas" safeArea>
      <View style={styles.filterContainer}>
        {(['all', 'open', 'resolved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[styles.filterText, filter === f && styles.filterTextActive]}
            >
              {f === 'all' ? 'Todas' : f === 'open' ? 'Abiertas' : 'Resueltas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {disputes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No hay disputas</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? 'No tienes disputas activas'
              : filter === 'open'
              ? 'No hay disputas abiertas'
              : 'No hay disputas resueltas'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={disputes}
          renderItem={renderDispute}
          keyExtractor={(item) => item.disputeId}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadDisputes}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de la Disputa</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedDispute && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Título:</Text>
                  <Text style={styles.modalValue}>{selectedDispute.title}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Tipo:</Text>
                  <Text style={styles.modalValue}>
                    {getTypeLabel(selectedDispute.type)}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Estado:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getDisputeColor(
                          selectedDispute.status
                        )}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getDisputeColor(selectedDispute.status) },
                      ]}
                    >
                      {getStatusLabel(selectedDispute.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Descripción:</Text>
                  <Text style={styles.modalDescription}>
                    {selectedDispute.description}
                  </Text>
                </View>

                {selectedDispute.status === 'open' ||
                selectedDispute.status === 'in_review' ? (
                  <View style={styles.messageSection}>
                    <Text style={styles.modalLabel}>Agregar mensaje:</Text>
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Escribe tu mensaje..."
                      value={newMessage}
                      onChangeText={setNewMessage}
                      multiline
                      numberOfLines={4}
                    />
                    <Button
                      onPress={handleSendMessage}
                      loading={sending}
                      disabled={!newMessage.trim()}
                    >
                      Enviar Mensaje
                    </Button>
                  </View>
                ) : null}
              </ScrollView>
            )}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    padding: 16,
  },
  disputeCard: {
    marginBottom: 12,
    padding: 16,
  },
  disputeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disputeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  disputeInfo: {
    flex: 1,
  },
  disputeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  disputeType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  disputeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disputeDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  messageCountText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  modalValue: {
    fontSize: 16,
    color: '#111827',
  },
  modalDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  messageSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
});
