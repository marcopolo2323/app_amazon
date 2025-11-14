import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Card from "../components/Card";
import Button from "../components/Button";
import { useOrdersStore, Order } from "../stores/orders";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrderById, updateOrder } = useOrdersStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetail();
  }, [id]);

  const loadOrderDetail = async () => {
    setLoading(true);
    try {
      if (id) {
        const orderData = getOrderById(id);
        setOrder(orderData || null);
      }
    } catch (error) {
      console.error("Error loading order detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: Order["status"]) => {
    switch (status) {
      case "confirmed":
        return {
          color: "#10B981",
          icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
          text: "Confirmado",
          description: "Tu pedido ha sido confirmado y está siendo procesado",
        };
      case "pending":
        return {
          color: "#F59E0B",
          icon: "time" as keyof typeof Ionicons.glyphMap,
          text: "Pendiente",
          description: "Tu pedido está esperando confirmación del proveedor",
        };
      case "in_progress":
        return {
          color: "#8B5CF6",
          icon: "sync" as keyof typeof Ionicons.glyphMap,
          text: "En Progreso",
          description: "El servicio está siendo realizado",
        };
      case "completed":
        return {
          color: "#10B981",
          icon: "checkmark-done" as keyof typeof Ionicons.glyphMap,
          text: "Completado",
          description: "El servicio ha sido completado exitosamente",
        };
      case "cancelled":
        return {
          color: "#EF4444",
          icon: "close-circle" as keyof typeof Ionicons.glyphMap,
          text: "Cancelado",
          description: "Este pedido ha sido cancelado",
        };
      default:
        return {
          color: "#6B7280",
          icon: "help-circle" as keyof typeof Ionicons.glyphMap,
          text: "Desconocido",
          description: "Estado del pedido desconocido",
        };
    }
  };

  const handleContactProvider = (method: "phone" | "whatsapp" | "email") => {
    if (!order) return;

    const { contactInfo } = order;
    const message = `Hola, me comunico por el pedido #${order.id}`;

    switch (method) {
      case "phone":
        if (contactInfo.phone) {
          Linking.openURL(`tel:${contactInfo.phone}`);
        }
        break;
      case "whatsapp":
        if (contactInfo.phone) {
          const url = `whatsapp://send?phone=${contactInfo.phone}&text=${encodeURIComponent(message)}`;
          Linking.openURL(url).catch(() => {
            const webUrl = `https://wa.me/${contactInfo.phone}?text=${encodeURIComponent(message)}`;
            Linking.openURL(webUrl);
          });
        }
        break;
      case "email":
        if (contactInfo.email) {
          Linking.openURL(
            `mailto:${contactInfo.email}?subject=${encodeURIComponent(`Pedido #${order.id}`)}`,
          );
        }
        break;
    }
  };

  const handleViewService = () => {
    if (order?.serviceId) {
      router.push({
        pathname: "/service-detail",
        params: { id: order.serviceId },
      });
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;

    Alert.alert(
      "Cancelar pedido",
      "¿Estás seguro de que quieres cancelar este pedido?",
      [
        { text: "No cancelar", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: () => {
            updateOrder(order.id, { status: "cancelled" });
            setOrder((prev) =>
              prev ? { ...prev, status: "cancelled" } : null,
            );
            Alert.alert("Pedido cancelado", "Tu pedido ha sido cancelado");
          },
        },
      ],
    );
  };

  const handleReorder = () => {
    if (order?.serviceId) {
      router.push({
        pathname: "/service-detail",
        params: { id: order.serviceId },
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "yape":
        return "Yape";
      case "plin":
        return "Plin";
      case "bank":
        return "Transferencia bancaria";
      case "mercado_pago":
        return "Mercado Pago";
      default:
        return method;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Detalle del Pedido</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderOrderStatus = () => {
    if (!order) return null;

    const statusInfo = getStatusInfo(order.status);

    return (
      <Card style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
        <View style={styles.statusHeader}>
          <View style={styles.statusIconContainer}>
            <Ionicons
              name={statusInfo.icon}
              size={24}
              color={statusInfo.color}
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
            <Text style={styles.statusDescription}>
              {statusInfo.description}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderOrderInfo = () => {
    if (!order) return null;

    return (
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Información del Pedido</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID del Pedido:</Text>
          <Text style={styles.infoValue}>
            #{order.id.slice(-8).toUpperCase()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Servicio:</Text>
          <TouchableOpacity onPress={handleViewService}>
            <Text style={[styles.infoValue, styles.linkText]}>
              {order.serviceTitle || order.serviceName}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Proveedor:</Text>
          <Text style={styles.infoValue}>{order.providerName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha del pedido:</Text>
          <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
        </View>

        {order.scheduledDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha programada:</Text>
            <Text style={styles.infoValue}>
              {formatDate(order.scheduledDate)}
              {order.scheduledTime &&
                ` a las ${formatTime(order.scheduledTime)}`}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dirección:</Text>
          <Text style={styles.infoValue}>{order.address}</Text>
        </View>

        {order.notes && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Notas:</Text>
            <Text style={styles.infoValue}>{order.notes}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total:</Text>
          <Text style={styles.totalValue}>${order.total.toLocaleString()}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Método de pago:</Text>
          <Text style={styles.infoValue}>
            {getPaymentMethodText(order.paymentMethod)}
          </Text>
        </View>

        {order.transactionId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID de transacción:</Text>
            <Text style={styles.infoValue}>{order.transactionId}</Text>
          </View>
        )}
      </Card>
    );
  };

  const renderContactInfo = () => {
    if (!order) return null;

    return (
      <Card style={styles.contactCard}>
        <Text style={styles.sectionTitle}>Información de Contacto</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombre:</Text>
          <Text style={styles.infoValue}>{order.contactInfo.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Teléfono:</Text>
          <TouchableOpacity onPress={() => handleContactProvider("phone")}>
            <Text style={[styles.infoValue, styles.linkText]}>
              {order.contactInfo.phone}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <TouchableOpacity onPress={() => handleContactProvider("email")}>
            <Text style={[styles.infoValue, styles.linkText]}>
              {order.contactInfo.email}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactProvider("whatsapp")}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactProvider("phone")}
          >
            <Ionicons name="call" size={20} color="#2563EB" />
            <Text style={styles.contactButtonText}>Llamar</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderActions = () => {
    if (!order) return null;

    const canCancel =
      order.status === "pending" || order.status === "confirmed";
    const canReorder =
      order.status === "completed" || order.status === "cancelled";

    return (
      <View style={styles.actionsContainer}>
        {canCancel && (
          <Button
            variant="outline"
            onPress={handleCancelOrder}
            style={[styles.actionButton, styles.cancelButton]}
          >
            Cancelar Pedido
          </Button>
        )}

        {canReorder && (
          <Button onPress={handleReorder} style={styles.actionButton}>
            Pedir de Nuevo
          </Button>
        )}

        <Button
          variant="outline"
          onPress={handleViewService}
          style={styles.actionButton}
        >
          Ver Servicio
        </Button>
      </View>
    );
  };

  if (loading) {
    return (
      <Screen safeArea scrollable={false}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Cargando detalle del pedido...</Text>
        </View>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen safeArea scrollable={false}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorTitle}>Pedido no encontrado</Text>
          <Text style={styles.errorText}>
            No se pudo encontrar el pedido solicitado
          </Text>
          <Button
            onPress={() => router.back()}
            style={styles.backToOrdersButton}
          >
            Volver a Pedidos
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea scrollable={false}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderOrderStatus()}
        {renderOrderInfo()}
        {renderContactInfo()}
        {renderActions()}
        <View style={styles.spacer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#ffffff",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Status Card
  statusCard: {
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIconContainer: {
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  // Info Card
  infoCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  linkText: {
    color: "#2563EB",
    textDecorationLine: "underline",
  },
  totalValue: {
    fontSize: 18,
    color: "#2563EB",
    fontWeight: "bold",
    flex: 2,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },

  // Contact Card
  contactCard: {
    padding: 20,
    marginBottom: 16,
  },
  contactButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 8,
  },

  // Actions
  actionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    width: "100%",
  },
  cancelButton: {
    borderColor: "#EF4444",
  },

  spacer: {
    height: 20,
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  backToOrdersButton: {
    minWidth: 120,
  },
});
