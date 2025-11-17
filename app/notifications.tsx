import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { useAuthStore } from '../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface Notification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: string;
  createdAt: string;
  data?: {
    orderId?: string;
    serviceId?: string;
    paymentId?: string;
    amount?: number;
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar notificaciones');

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.notificationId);
    }

    // Navigate based on notification type
    if (notification.data?.orderId) {
      router.push(`/order-detail?id=${notification.data.orderId}` as any);
    } else if (notification.data?.serviceId) {
      router.push(`/service-detail?id=${notification.data.serviceId}` as any);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      order_new: 'receipt-outline',
      order_confirmed: 'checkmark-circle-outline',
      order_completed: 'checkmark-done-outline',
      order_cancelled: 'close-circle-outline',
      payment_received: 'wallet-outline',
      payment_pending: 'time-outline',
      affiliate_approved: 'thumbs-up-outline',
      affiliate_rejected: 'thumbs-down-outline',
      service_approved: 'checkmark-outline',
      service_rejected: 'close-outline',
      review_new: 'star-outline',
      dispute_new: 'alert-circle-outline',
      dispute_resolved: 'shield-checkmark-outline',
      system: 'information-circle-outline',
    };
    return icons[type] || 'notifications-outline';
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      order_new: '#3B82F6',
      order_confirmed: '#10B981',
      order_completed: '#059669',
      order_cancelled: '#EF4444',
      payment_received: '#10B981',
      payment_pending: '#F59E0B',
      affiliate_approved: '#10B981',
      affiliate_rejected: '#EF4444',
      service_approved: '#10B981',
      service_rejected: '#EF4444',
      review_new: '#F59E0B',
      dispute_new: '#EF4444',
      dispute_resolved: '#10B981',
      system: '#6B7280',
    };
    return colors[type] || '#6B7280';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} d`;
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);
    const color = getNotificationColor(item.type);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <Card
          style={[
            styles.notificationCard,
            !item.read && styles.notificationCardUnread,
          ]}
        >
          <View style={styles.notificationContent}>
            <View style={[styles.notificationIcon, { backgroundColor: `${color}15` }]}>
              <Ionicons name={icon} size={24} color={color} />
            </View>

            <View style={styles.notificationText}>
              <View style={styles.notificationHeader}>
                <Text
                  style={[
                    styles.notificationTitle,
                    !item.read && styles.notificationTitleUnread,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.message}
              </Text>

              <View style={styles.notificationFooter}>
                <Text style={styles.notificationTime}>
                  {formatTime(item.createdAt)}
                </Text>
                {item.priority === 'high' || item.priority === 'urgent' ? (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>
                      {item.priority === 'urgent' ? 'Urgente' : 'Importante'}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <Screen title="Notificaciones" safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Notificaciones" safeArea>
      {unreadCount > 0 && (
        <View style={styles.headerActions}>
          <Text style={styles.unreadText}>{unreadCount} sin leer</Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        </View>
      )}

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No hay notificaciones</Text>
          <Text style={styles.emptyText}>
            Te notificaremos cuando haya novedades
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.notificationId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
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
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  unreadText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  markAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
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
  notificationCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  notificationCardUnread: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  notificationContent: {
    flexDirection: 'row',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  notificationTitleUnread: {
    color: '#111827',
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priorityBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
});
