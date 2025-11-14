import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../components/Screen';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import { ThemedText } from '../../../components/themed-text';
import RequireAuth from '../../../components/auth/RequireAuth';
import { useAuthStore } from '../../../stores/auth';
import { Api } from '../../../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import Input from '../../../components/Input';

interface BackendService {
  serviceId: string;
  affiliateId: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  images: string[];
  locationText?: string;
  status: 'active' | 'inactive' | 'sold';
  createdAt: string;
}

const statusConfig = {
  active: { label: 'Activo', color: '#10B981', bg: '#D1FAE5' },
  inactive: { label: 'Inactivo', color: '#6B7280', bg: '#F3F4F6' },
};

export default function MyServicesScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [services, setServices] = useState<BackendService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState<{
    serviceId: string;
    title: string;
    price: number;
    description?: string;
    status: 'active' | 'inactive' | 'sold';
  } | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refrescar al volver a esta pestaña (por ejemplo, tras crear un servicio)
      loadServices(true);
    }, []),
  );

  const loadServices = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const data = await Api.listServices(token || undefined);
      const myServices = Array.isArray(data)
        ? (data as BackendService[]).filter((s) => s.affiliateId === (user as any)?.userId)
        : [];
      setServices(myServices);
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'No se pudieron cargar tus servicios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredServices = services.filter((s) => {
    const statusOk = statusFilter === 'all' || s.status === statusFilter;
    const searchOk = !searchQuery.trim() || s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return statusOk && searchOk;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    loadServices(true);
  };

  const handleAddService = () => {
    router.push('/affiliate/services/add');
  };

  const handleEditService = (serviceId: string) => {
    router.push(`/affiliate/services/${serviceId}/edit` as any);
  };

  const openEdit = (service: BackendService) => {
    setEditing({
      serviceId: service.serviceId,
      title: service.title,
      price: service.price,
      description: service.description,
      status: service.status,
    });
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { serviceId, title, price, description, status } = editing;
    // Optimistic update
    setServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, title, price, description, status } : s))
    );
    try {
      if (!token) throw new Error('No autenticado');
      await Api.updateService(token, serviceId, { title, price, description, status });
      setEditVisible(false);
      setEditing(null);
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar los cambios');
      // Reload services to rollback accurately
      loadServices(true);
    }
  };

  const handleToggleStatus = (serviceId: string, currentStatus: 'active' | 'inactive' | 'sold') => {
    const isActive = currentStatus === 'active';
    const nextStatus = isActive ? 'inactive' : 'active';
    const action = isActive ? 'desactivar' : 'activar';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} servicio`,
      `¿Estás seguro de que quieres ${action} este servicio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            // Optimistic update
            setServices(prev =>
              prev.map(service =>
                service.serviceId === serviceId
                  ? { ...service, status: nextStatus }
                  : service
              )
            );

            try {
              if (!token) throw new Error('No autenticado');
              await Api.updateService(token, serviceId, { status: nextStatus });
            } catch (err) {
              // Revert on error
              setServices(prev =>
                prev.map(service =>
                  service.serviceId === serviceId
                    ? { ...service, status: currentStatus }
                    : service
                )
              );
              Alert.alert('Error', 'No se pudo actualizar el estado del servicio');
            }
          },
        },
      ]
    );
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      'Eliminar servicio',
      '¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            // Optimistic removal
            const prevServices = services;
            setServices(prev => prev.filter(service => service.serviceId !== serviceId));
            try {
              if (!token) throw new Error('No autenticado');
              await Api.deleteService(token, serviceId);
            } catch (err) {
              // Revert on error
              setServices(prevServices);
              Alert.alert('Error', 'No se pudo eliminar el servicio');
            }
          },
        },
      ]
    );
  };

  const mapsApiKey = (process as any).env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;
  const buildStaticMapUrl = (locationText?: string) => {
    if (!mapsApiKey || !locationText) return null;
    const q = encodeURIComponent(locationText);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${q}&zoom=14&size=600x200&maptype=roadmap&markers=color:red|${q}&key=${mapsApiKey}`;
  };
  const openInMaps = (query?: string) => {
    if (!query) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir Google Maps'));
  };

  const formatPrice = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCityFromLocationText = (locationText?: string) => {
    if (!locationText) return '—';
    const parts = locationText.split(',').map(p => p.trim());
    return parts.length > 1 ? parts[1] : parts[0] || '—';
  };

  const renderServiceCard = (service: BackendService) => {
    const status = service.status === 'active' ? 'active' : 'inactive';
    const statusInfo = statusConfig[status as 'active' | 'inactive'];
    const staticMapUrl = buildStaticMapUrl(service.locationText);

    return (
      <Card
        key={service.serviceId}
        style={styles.serviceCard}
        onPress={() => router.push({ pathname: '/service-detail', params: { id: service.serviceId } } as any)}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <ThemedText style={styles.serviceTitle} numberOfLines={2}>
              {service.title}
            </ThemedText>
            <ThemedText style={styles.serviceCategory}>{service.category}</ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {service.description ? (
          <ThemedText style={styles.serviceDescription} numberOfLines={3}>
            {service.description}
          </ThemedText>
        ) : null}

        <View style={styles.serviceStats}>
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <ThemedText style={styles.statText}>{getCityFromLocationText(service.locationText)}</ThemedText>
          </View>
        </View>

        {staticMapUrl ? (
          <Image source={{ uri: staticMapUrl }} style={styles.mapThumb} />
        ) : (
          <TouchableOpacity style={styles.mapButton} onPress={() => openInMaps(service.locationText)}>
            <Ionicons name="map-outline" size={16} color="#2563EB" />
            <ThemedText style={styles.mapButtonText}>Ver en Google Maps</ThemedText>
          </TouchableOpacity>
        )}

        <View style={styles.serviceFooter}>
          <ThemedText style={styles.servicePrice}>{formatPrice(service.price)}</ThemedText>
          <View style={styles.serviceActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleToggleStatus(service.serviceId, service.status)}
            >
              <Ionicons name={service.status === 'active' ? 'pause-outline' : 'play-outline'} size={18} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEdit(service)}
            >
              <Ionicons name="create-outline" size={18} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteService(service.serviceId)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.serviceDate}>Publicado: {formatDate(service.createdAt)}</Text>
      </Card>
    );
  };

  if (loading) {
    return (
      <Screen safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <ThemedText style={styles.loadingText}>Cargando tus servicios...</ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <RequireAuth roles={["affiliate"]}>
      <Screen
        title="Mis Servicios"
        subtitle="Administra los servicios que has publicado"
        safeArea
        scrollable
      >
        <View style={styles.header}>
          <View style={styles.filtersContainer}>
            <Input
              placeholder="Buscar por título"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            <View style={styles.filterChips}>
              {([
                { key: 'all', label: 'Todos' },
                { key: 'active', label: 'Activos' },
                { key: 'inactive', label: 'Inactivos' },
              ] as const).map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, statusFilter === f.key ? styles.chipActive : null]}
                  onPress={() => setStatusFilter(f.key)}
                >
                  <ThemedText style={[styles.chipText, statusFilter === f.key ? styles.chipTextActive : null]}>
                    {f.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatNumber}>{services.length}</Text>
              <Text style={styles.headerStatLabel}>Publicados</Text>
            </View>
          </View>
          <Button onPress={handleAddService} style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Agregar nuevo servicio</Text>
          </Button>
        </View>

        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>Aún no tienes servicios</Text>
            <Text style={styles.emptyStateDescription}>
              Publica tu primer servicio para que los clientes puedan encontrarte.
            </Text>
            <Button onPress={handleAddService} style={styles.addFirstServiceButton}>
              <Text style={styles.addButtonText}>Publicar mi primer servicio</Text>
            </Button>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.servicesList}
          >
            {filteredServices.map(renderServiceCard)}
          </ScrollView>
        )}

        <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Editar servicio</ThemedText>
              <Input
                label="Título"
                value={editing?.title || ''}
                onChangeText={(t) => setEditing((prev) => (prev ? { ...prev, title: t } : prev))}
              />
              <Input
                label="Precio"
                value={editing ? String(editing.price) : ''}
                onChangeText={(t) => {
                  const v = Number(t.replace(/[^0-9.]/g, '')) || 0;
                  setEditing((prev) => (prev ? { ...prev, price: v } : prev));
                }}
                keyboardType="numeric"
              />
              <Input
                label="Descripción"
                value={editing?.description || ''}
                onChangeText={(t) => setEditing((prev) => (prev ? { ...prev, description: t } : prev))}
                multiline
              />
              <View style={styles.modalActions}>
                <Button variant="secondary" onPress={() => setEditVisible(false)}>Cancelar</Button>
                <Button onPress={saveEdit}>Guardar</Button>
              </View>
            </View>
          </View>
        </Modal>
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
  header: {
    marginBottom: 24,
  },
  filtersContainer: {
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    // wrapper style for Input
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#ffffff',
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    color: '#374151',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerStat: {
    alignItems: 'center',
  },
  headerStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  servicesList: {
    gap: 16,
    paddingBottom: 20,
  },
  serviceCard: {
    padding: 20,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 24,
  },
  serviceCategory: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  serviceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
  },
  mapThumb: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    marginBottom: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  mapButtonText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  serviceDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstServiceButton: {
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
});
