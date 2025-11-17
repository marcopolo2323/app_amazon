import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { useAuthStore } from '../../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  images?: string[];
  affiliateName?: string;
  categoryName?: string;
  createdAt: string;
}

export default function AdminServicesScreen() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadServices();
  }, [page]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/services?page=${page}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar servicios');

      const data = await response.json();
      setServices(data.services);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'No se pudieron cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const renderService = ({ item }: { item: Service }) => (
    <Card style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: `${API_URL}${item.images[0]}` }}
            style={styles.serviceImage}
          />
        ) : (
          <View style={styles.servicePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
          </View>
        )}
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.serviceAffiliate}>{item.affiliateName}</Text>
          <Text style={styles.serviceCategory}>{item.categoryName}</Text>
          <Text style={styles.servicePrice}>S/ {item.price.toFixed(2)}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
    </Card>
  );

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
    };
    return labels[status] || status;
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, any> = {
      active: { backgroundColor: '#D1FAE5' },
      inactive: { backgroundColor: '#F3F4F6' },
      pending: { backgroundColor: '#FEF3C7' },
    };
    return styles[status] || {};
  };

  if (loading && services.length === 0) {
    return (
      <Screen title="Servicios" safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Servicios" safeArea>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadServices}
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
  serviceCard: {
    marginBottom: 12,
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  servicePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceAffiliate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  serviceCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
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
    color: '#374151',
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
