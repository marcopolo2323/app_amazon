import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Card from "../components/Card";
import Button from "../components/Button";
import { useOrdersStore } from "../stores/orders";
import { useAuthStore } from "../stores/auth";
import { Api } from "../lib/api";

interface OrderDetails {
  bookingId: string;
  serviceName: string;
  providerName: string;
  date: string;
  time: string;
  address: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  transactionId?: string;
  contactInfo: {
    phone: string;
    email: string;
  };
}

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { bookingId, paymentMethod, transactionId, success, orderId } =
    useLocalSearchParams<{
      bookingId?: string;
      paymentMethod?: string;
      transactionId?: string;
      success?: string;
      orderId?: string;
    }>();

  const { getOrderById, updateOrder } = useOrdersStore();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  const isPaymentSuccessful = success === "true";

  useEffect(() => {
    loadOrderDetails();
  }, [bookingId, orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      // Si viene desde back_urls de MP, usar orderId real y backend
      if (orderId) {
        const order = await Api.getOrder(token || "", String(orderId));
        const service = await Api.getOrderInvoice(token || "", String(orderId));
        const s = service?.service;
        const details: OrderDetails = {
          bookingId: String(order._id),
          serviceName: s?.title || "Servicio",
          providerName: "Proveedor",
          date: new Date(order.createdAt).toLocaleDateString(),
          time: new Date(order.createdAt).toLocaleTimeString(),
          address: s?.locationText || "",
          totalAmount: Number(order.amount || 0),
          paymentMethod: String(order.paymentMethod || paymentMethod || "mercado_pago"),
          status: String(order.paymentStatus === "completed" ? "confirmed" : order.status || "pending"),
          transactionId: transactionId,
          contactInfo: {
            phone: "",
            email: "",
          },
        };
        setOrderDetails(details);
        return;
      }

      // Fallback: obtener de store usando bookingId
      if (bookingId) {
        const order = getOrderById(String(bookingId));
        if (order) {
          if (isPaymentSuccessful && transactionId) {
            updateOrder(String(bookingId), {
              status: "confirmed",
              transactionId: transactionId,
            });
          }
          const details: OrderDetails = {
            bookingId: order.id,
            serviceName: order.serviceTitle || order.serviceName,
            providerName: order.providerName,
            date:
              order.scheduledDate || order.bookingDetails?.date || "No especificada",
            time:
              order.scheduledTime || order.bookingDetails?.time || "No especificada",
            address: order.address,
            totalAmount: order.total,
            paymentMethod: order.paymentMethod,
            status: isPaymentSuccessful ? "confirmed" : order.status,
            transactionId: transactionId || order.transactionId,
            contactInfo: {
              phone: order.contactInfo.phone,
              email: order.contactInfo.email,
            },
          };
          setOrderDetails(details);
        } else {
          // Si no se encuentra, mostrar básico
          setOrderDetails({
            bookingId: String(bookingId),
            serviceName: "Servicio",
            providerName: "Proveedor",
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            address: "",
            totalAmount: 0,
            paymentMethod: paymentMethod || "",
            status: isPaymentSuccessful ? "confirmed" : "pending",
            transactionId,
            contactInfo: { phone: "", email: "" },
          });
        }
      }
    } catch (error) {
      console.error("Error cargando detalles de la orden:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallProvider = () => {
    if (orderDetails?.contactInfo.phone) {
      Linking.openURL(`tel:${orderDetails.contactInfo.phone}`);
    }
  };

  const handleWhatsAppProvider = () => {
    if (orderDetails?.contactInfo.phone) {
      const message = `Hola, me comunico por el servicio reservado: ${orderDetails.serviceName} (Reserva #${orderDetails.bookingId})`;
      const url = `whatsapp://send?phone=${orderDetails.contactInfo.phone}&text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/${orderDetails.contactInfo.phone}?text=${encodeURIComponent(message)}`;
        Linking.openURL(webUrl);
      });
    }
  };

  const handleViewMyOrders = () => {
    router.push("/(tabs)/orders");
  };

  const handleBackToHome = () => {
    router.push("/(tabs)/home");
  };

  // Determina color, icono y texto según el estado
  const getStatusInfo = (): {
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
  } => {
    if (!orderDetails)
      return { color: "#6B7280", icon: "help-circle", text: "Desconocido" };

    switch (orderDetails.status) {
      case "confirmed":
        return {
          color: "#10B981",
          icon: "checkmark-circle",
          text: "Confirmado",
        };
      case "pending":
        return {
          color: "#F59E0B",
          icon: "time",
          text: "Pendiente",
        };
      case "cancelled":
      case "canceled":
        return {
          color: "#EF4444",
          icon: "close-circle",
          text: "Cancelado",
        };
      default:
        return {
          color: "#6B7280",
          icon: "help-circle",
          text: orderDetails.status || "Desconocido",
        };
    }
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

  const renderSuccessHeader = () => (
    <Card style={styles.successCard}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
      </View>
      <Text style={styles.successTitle}>¡Reserva Confirmada!</Text>
      <Text style={styles.successSubtitle}>
        Tu reserva ha sido procesada exitosamente
      </Text>
      <View style={styles.bookingIdContainer}>
        <Text style={styles.bookingIdLabel}>ID de Reserva:</Text>
        <Text style={styles.bookingIdValue}>#{orderDetails?.bookingId}</Text>
      </View>
    </Card>
  );

  const renderOrderDetails = () => {
    if (!orderDetails) return null;

    const statusInfo = getStatusInfo();

    return (
      <Card style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Detalles de la reserva</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Servicio:</Text>
          <Text style={styles.detailValue}>{orderDetails.serviceName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Proveedor:</Text>
          <Text style={styles.detailValue}>{orderDetails.providerName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fecha y hora:</Text>
          <Text style={styles.detailValue}>
            {orderDetails.date} a las {orderDetails.time}
          </Text>
        </View>

        {orderDetails.address ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ubicación:</Text>
            <Text style={styles.detailValue}>{orderDetails.address}</Text>
          </View>
        ) : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValuePrice}>
            ${orderDetails.totalAmount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Método de pago:</Text>
          <Text style={styles.detailValue}>
            {getPaymentMethodText(orderDetails.paymentMethod)}
          </Text>
        </View>

        {orderDetails.transactionId && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID de transacción:</Text>
            <Text style={styles.detailValue}>{orderDetails.transactionId}</Text>
          </View>
        )}

        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Ionicons
              name={statusInfo.icon}
              size={20}
              color={statusInfo.color}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              Estado: {statusInfo.text}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderContactProvider = () => {
    if (!orderDetails) return null;

    return (
      <Card style={styles.contactCard}>
        <Text style={styles.sectionTitle}>Contactar proveedor</Text>
        <Text style={styles.contactDescription}>
          Puedes comunicarte directamente con el proveedor para coordinar
          detalles
        </Text>

        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleCallProvider}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={20} color="#2563EB" />
            <Text style={styles.contactButtonText}>Llamar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleWhatsAppProvider}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderNextSteps = () => (
    <Card style={styles.nextStepsCard}>
      <Text style={styles.sectionTitle}>Próximos pasos</Text>

      <View style={styles.stepsList}>
        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirmación del proveedor</Text>
            <Text style={styles.stepDescription}>
              El proveedor confirmará la cita y se pondrá en contacto contigo
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Preparación</Text>
            <Text style={styles.stepDescription}>
              Asegúrate de tener todo listo para la fecha programada
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Día del servicio</Text>
            <Text style={styles.stepDescription}>
              El proveedor se presentará en la fecha y hora acordada
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <Button
        onPress={handleViewMyOrders}
        variant="outline"
        style={styles.actionButton}
      >
        Ver mis reservas
      </Button>

      <Button onPress={handleBackToHome} style={styles.actionButton}>
        Volver al inicio
      </Button>
    </View>
  );

  if (loading) {
    return (
      <Screen safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Procesando reserva...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea>
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderSuccessHeader()}
          {renderOrderDetails()}
          {renderContactProvider()}
          {renderNextSteps()}
          <View style={styles.spacer} />
        </ScrollView>

        {renderActionButtons()}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Success Header
  successCard: {
    padding: 32,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#F0FDF4",
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  bookingIdContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bookingIdLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  bookingIdValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },

  // Details Card
  detailsCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    marginRight: 12,
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  detailValuePrice: {
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "bold",
    flex: 2,
    textAlign: "right",
  },
  statusContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Contact Card
  contactCard: {
    padding: 20,
    marginBottom: 16,
  },
  contactDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButtons: {
    flexDirection: "row",
    gap: 12,
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

  // Next Steps
  nextStepsCard: {
    padding: 20,
    marginBottom: 16,
  },
  stepsList: {
    gap: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  spacer: {
    height: 20,
  },

  // Action Buttons
  actionButtons: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 32,
    gap: 12,
  },
  actionButton: {
    width: "100%",
  },
});
