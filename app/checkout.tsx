import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAuthStore } from "../stores/auth";
import { useOrdersStore } from "../stores/orders";
import { Api } from "../lib/api";
import ModalPicker from "../components/ModalPicker";


interface BookingDetails {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  quantity: number;
  totalPrice: number;
  provider: {
    name: string;
    id: string;
  };
}

interface BookingForm {
  address: string;
  notes: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

type PaymentMethod = "yape" | "plin" | "mercado_pago" | "bank";

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { createBookingFromService } = useOrdersStore();
  const { serviceId, quantity, totalPrice } = useLocalSearchParams<{
    serviceId?: string;
    quantity?: string;
    totalPrice?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null,
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("mercado_pago");
  const [form, setForm] = useState<BookingForm>({
    address: "",
    notes: "",
    contactName: user?.name || "",
    contactPhone: user?.phone || "",
    contactEmail: user?.email || "",
  });
  const [errors, setErrors] = useState<Partial<BookingForm>>({});

  useEffect(() => {
    loadBookingDetails();
  }, [serviceId]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {

      const services = await Api.listServices(token || undefined);
      const s = services.find(
        (x: any) => String(x.serviceId || x._id) === String(serviceId),
      );
      if (!s) {
        throw new Error("Servicio no encontrado");
      }
      const qty = parseInt(quantity || "1");
      const price = Number(s.price || 0);
      const total = totalPrice ? parseFloat(totalPrice) : qty * price;
      setBookingDetails({
        serviceId: String(s.serviceId || s._id),
        serviceName: s.title || "Servicio",
        servicePrice: price,
        quantity: qty,
        totalPrice: total,
        provider: {
          name: user?.name || "Proveedor",
          id: String(s.affiliateId || user?.id || ""),
        },
      });
      // Prefill address from service location
      setForm((prev) => ({ ...prev, address: s.locationText || "" }));
    } catch (error) {
      console.error("Error loading booking details:", error);
      Alert.alert("Error", "No se pudo cargar la información del servicio");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingForm> = {};

    if (!form.contactName.trim()) {
      newErrors.contactName = "El nombre de contacto es requerido";
    }

    if (!form.contactPhone.trim()) {
      newErrors.contactPhone = "El teléfono de contacto es requerido";
    } else if (!/^\+?[\d\s\-()]+$/.test(form.contactPhone)) {
      newErrors.contactPhone = "Formato de teléfono inválido";
    }

    if (!form.contactEmail.trim()) {
      newErrors.contactEmail = "El email de contacto es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      newErrors.contactEmail = "Formato de email inválido";
    }

    if (!form.address.trim()) {
      newErrors.address = "La dirección es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor corrige los errores en el formulario");
      return;
    }

    if (!bookingDetails) {
      Alert.alert("Error", "No se encontraron los detalles de la reserva");
      return;
    }

    if (!token) {
      Alert.alert("Autenticación requerida", "Debes iniciar sesión para crear la orden.");
      return;
    }

    setSubmitting(true);

    try {
      // Crear orden REAL en el backend con datos completos
      const payload = {
        serviceId: bookingDetails.serviceId,
        serviceTitle: bookingDetails.serviceName,
        providerId: bookingDetails.provider.id,
        providerName: bookingDetails.provider.name,
        paymentMethod: "mercado_pago" as PaymentMethod,
        quantity: bookingDetails.quantity,
        amount: bookingDetails.totalPrice,
        currency: "PEN",
        address: form.address,
        notes: form.notes,
        contactInfo: {
          name: form.contactName,
          phone: form.contactPhone,
          email: form.contactEmail,
        },
        bookingDetails: {
          quantity: bookingDetails.quantity,
        },
      };

      const created = await Api.createOrder(token, payload);

      const orderId = String(created._id || created.orderId);

      // Navegar a flujo de Mercado Pago (único método)
      router.push({
        pathname: "/mercado-pago",
        params: {
          bookingId: orderId,
          orderId: orderId,
          amount: bookingDetails.totalPrice.toString(),
          serviceId: bookingDetails.serviceId,
        },
      });
    } catch (error: any) {
      console.error("Error creating booking:", error);
      const msg = error?.message || "No se pudo procesar la reserva. Intenta de nuevo.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field: keyof BookingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const paymentMethods = [
    {
      id: "mercado_pago" as PaymentMethod,
      name: "Mercado Pago",
      description: "Pago seguro con Mercado Pago",
      icon: "wallet-outline",
      color: "#009EE3",
    },
    {
      id: "yape" as PaymentMethod,
      name: "Yape",
      description: "Pago por Yape",
      icon: "cash-outline",
      color: "#10B981",
    },
    {
      id: "plin" as PaymentMethod,
      name: "Plin",
      description: "Pago por Plin",
      icon: "cash-outline",
      color: "#10B981",
    },
    {
      id: "bank" as PaymentMethod,
      name: "Transferencia bancaria",
      description: "Transferencia a cuenta bancaria",
      icon: "swap-horizontal-outline",
      color: "#8B5CF6",
    },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Confirmar Reserva</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderBookingSummary = () => {
    if (!bookingDetails) return null;

    return (
      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Resumen de la reserva</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Servicio:</Text>
          <Text style={styles.summaryValue}>{bookingDetails.serviceName}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Proveedor:</Text>
          <Text style={styles.summaryValue}>
            {bookingDetails.provider.name}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cantidad:</Text>
          <Text style={styles.summaryValue}>{bookingDetails.quantity}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Precio unitario:</Text>
          <Text style={styles.summaryValue}>
            ${bookingDetails.servicePrice.toLocaleString()}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            ${bookingDetails.totalPrice.toLocaleString()}
          </Text>
        </View>
      </Card>
    );
  };

  const renderBookingForm = () => (
    <Card style={styles.formCard}>
      <Text style={styles.sectionTitle}>Detalles de la reserva</Text>

      <Input
        label="Dirección"
        placeholder="Dirección de servicio (requerida)"
        value={form.address}
        onChangeText={(value) => updateForm("address", value)}
        error={errors.address}
        leftIcon="location-outline"
        multiline
        numberOfLines={2}
        required
      />

      <Input
        label="Notas adicionales"
        placeholder="Instrucciones especiales (opcional)"
        value={form.notes}
        onChangeText={(value) => updateForm("notes", value)}
        leftIcon="document-text-outline"
        multiline
        numberOfLines={3}
      />

      <Text style={styles.subsectionTitle}>Información de contacto</Text>

      <Input
        label="Nombre completo"
        placeholder="Tu nombre completo"
        value={form.contactName}
        onChangeText={(value) => updateForm("contactName", value)}
        error={errors.contactName}
        leftIcon="person-outline"
        required
      />

      <Input
        label="Teléfono"
        placeholder="+1 234 567 8900"
        value={form.contactPhone}
        onChangeText={(value) => updateForm("contactPhone", value)}
        error={errors.contactPhone}
        leftIcon="call-outline"
        keyboardType="phone-pad"
        required
      />

      <Input
        label="Email"
        placeholder="tu@email.com"
        value={form.contactEmail}
        onChangeText={(value) => updateForm("contactEmail", value)}
        error={errors.contactEmail}
        leftIcon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        required
      />
    </Card>
  );

  const renderPaymentMethods = () => (
    <Card style={styles.paymentCard}>
      <Text style={styles.sectionTitle}>Método de pago</Text>

      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.paymentMethod,
            selectedPaymentMethod === method.id && styles.paymentMethodSelected,
          ]}
          onPress={() => setSelectedPaymentMethod(method.id)}
          activeOpacity={0.7}
        >
          <View style={styles.paymentMethodContent}>
            <View
              style={[
                styles.paymentIcon,
                { backgroundColor: `${method.color}15` },
              ]}
            >
              <Ionicons
                name={method.icon as any}
                size={24}
                color={method.color}
              />
            </View>

            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodName}>{method.name}</Text>
              <Text style={styles.paymentMethodDescription}>
                {method.description}
              </Text>
            </View>

            <View style={styles.radioButton}>
              {selectedPaymentMethod === method.id && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </Card>
  );

  const renderTimePicker = () => {
    if (!showTimePicker) return null;
    return (
      <TimeWheelPicker
        visible={showTimePicker}
        title="Selecciona hora"
        value={form.time || `${hour}:${minute}`}
        allowedHours={HOURS_CHECKOUT}
        allowedMinutes={MINUTES_CHECKOUT}
        onChange={(time) => {
          const [hh, mm] = time.split(":");
          setHour(hh);
          setMinute(mm);
          updateForm("time", time);
        }}
        onRequestClose={() => setShowTimePicker(false)}
      />
    );
  };

  const renderDatePicker = () => {
    if (!showDatePicker) return null;
    return (
      <DateWheelPicker
        visible={showDatePicker}
        title="Selecciona fecha"
        value={form.date}
        onChange={(date) => updateForm("date", date)}
        onRequestClose={() => setShowDatePicker(false)}
      />
    );
  };

  const renderSubmitButton = () => (
    <View style={styles.submitContainer}>
      <Button
        onPress={handleSubmit}
        loading={submitting}
        style={styles.submitButton}
      >
        {selectedPaymentMethod === "mercado_pago"
          ? "Proceder al Pago"
          : "Confirmar Reserva"}
      </Button>
    </View>
  );

  if (loading) {
    return (
      <Screen safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea>
      <View style={styles.container}>
        {renderHeader()}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
          {renderBookingSummary()}
          {renderBookingForm()}
          {renderPaymentMethods()}
          <View style={styles.spacer} />
        </ScrollView>

        {renderSubmitButton()}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 16,
  },

  // Summary Card
  summaryCard: {
    padding: 20,
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563EB",
  },

  // Form Card
  formCard: {
    padding: 20,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 20,
    marginBottom: 16,
  },


  // Payment Card styles
  paymentCard: {
    padding: 20,
    marginBottom: 16,
  },
  paymentMethod: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  paymentMethodSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  paymentMethodContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },

  // Submit styles
  submitContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#ffffff",
  },
  submitButton: {
    // uses Button defaults; container controls layout
  },
  spacer: {
    height: 16,
  },
});
