import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useAuthStore } from "../../stores/auth";
import { useOrdersStore, useOrders, Order } from "../../stores/orders";
import { Api } from "../../lib/api";
import { ThemedText } from "../../components/themed-text";

const statusConfig = {
  pending: { label: "Pendiente", color: "#F59E0B", bg: "#FEF3C7" },
  confirmed: { label: "Confirmado", color: "#3B82F6", bg: "#DBEAFE" },
  in_progress: { label: "En progreso", color: "#8B5CF6", bg: "#EDE9FE" },
  completed: { label: "Completado", color: "#10B981", bg: "#D1FAE5" },
  cancelled: { label: "Cancelado", color: "#EF4444", bg: "#FEE2E2" },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const orders = useOrders();
  const { loading, setLoading, setOrders } = useOrdersStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      if (!token) {
        setOrders([]);
        return;
      }
      const items = await Api.listOrders(token);
      const mapped: Order[] = (items || []).map((o: any) => {
        const pm = String(o.paymentMethod || 'bank');
        const allowed = ["yape", "plin", "bank", "mercado_pago"] as const;
        const paymentMethod = (allowed as readonly string[]).includes(pm) ? (pm as any) : "bank";
        return {
          id: o.id || o.orderId || String(o._id || ''),
          serviceId: o.serviceId || '',
          serviceTitle: o.serviceTitle || o.serviceName || 'Servicio',
          serviceName: o.serviceName || o.serviceTitle || 'Servicio',
          providerName: o.providerName || 'Proveedor',
          providerId: o.providerId || '',
          status: o.status || 'pending',
          total: Number(o.total ?? o.amount ?? 0),
          currency: o.currency || 'USD',
          paymentMethod,
          transactionId: o.transactionId,
          createdAt: o.createdAt,
          scheduledDate: o.scheduledDate || undefined,
          scheduledTime: o.scheduledTime || undefined,
          address: o.address || '',
          description: o.description || o.notes || '',
          notes: o.notes || undefined,
          contactInfo: o.contactInfo || { name: '', phone: '', email: '' },
          bookingDetails: o.bookingDetails || undefined,
        } as Order;
      });
      setOrders(mapped);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders(true);
  };

  const handleOrderPress = (order: Order) => {
    router.push({
      pathname: "/order-detail",
      params: { id: order.id },
    });
  };

  const handleViewInvoice = (orderId: string) => {
    router.push(`/orders/${orderId}/invoice`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return `${currency === "USD" ? "$" : currency} ${amount.toFixed(2)}`;
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusInfo = statusConfig[item.status];

    return (
      <TouchableOpacity
        style={styles.orderItem}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.serviceTitle} numberOfLines={1}>
                {item.serviceTitle || item.serviceName}
              </Text>
              <Text style={styles.providerName}>por {item.providerName}</Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}
            >
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {(item.description || item.notes) && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description || item.notes}
            </Text>
          )}

          <View style={styles.orderDetails}>
            <View style={styles.dateSection}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.dateText}>
                Creado: {formatDate(item.createdAt)}
              </Text>
            </View>
            {item.scheduledDate && (
              <View style={styles.dateSection}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.dateText}>
                  Programado: {formatDate(item.scheduledDate)}
                  {item.scheduledTime && ` a las ${item.scheduledTime}`}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.orderFooter}>
            <Text style={styles.price}>
              {formatPrice(item.total, item.currency)}
            </Text>

            <View style={styles.actionButtons}>
              {item.status === "completed" && (
                <TouchableOpacity
                  style={styles.invoiceButton}
                  onPress={() => handleViewInvoice(item.id)}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color="#2563EB"
                  />
                  <Text style={styles.invoiceButtonText}>Factura</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Ver detalles</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
      <ThemedText style={styles.emptyStateTitle}>No tienes pedidos</ThemedText>
      <ThemedText style={styles.emptyStateDescription}>
        Cuando realices tu primer pedido, aparecerá aquí
      </ThemedText>
      <Button
        onPress={() => router.push("/filter")}
        style={styles.exploreButton}
      >
        Explorar servicios
      </Button>
    </View>
  );

  const renderLoginPrompt = () => (
    <View style={styles.loginPrompt}>
      <Ionicons name="log-in-outline" size={64} color="#D1D5DB" />
      <ThemedText style={styles.loginPromptTitle}>Inicia sesión</ThemedText>
      <ThemedText style={styles.loginPromptDescription}>
        Inicia sesión para ver tu historial de pedidos
      </ThemedText>
      <Button onPress={() => router.push("/login")} style={styles.loginButton}>
        Iniciar sesión
      </Button>
    </View>
  );

  if (!user) {
    return (
      <Screen title="Mis pedidos" safeArea scrollable={false}>
        {renderLoginPrompt()}
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen title="Mis pedidos" safeArea scrollable={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <ThemedText style={styles.loadingText}>Cargando pedidos...</ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title="Mis pedidos"
      subtitle="Tu historial de servicios"
      safeArea
      scrollable={false}
    >
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          orders.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  orderItem: {
    marginBottom: 16,
  },
  orderCard: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  orderDetails: {
    marginBottom: 16,
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  invoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
  },
  invoiceButtonText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
    marginLeft: 4,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 14,
    color: "#6B7280",
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    paddingHorizontal: 32,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },
  loginPromptDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    paddingHorizontal: 32,
  },
});
