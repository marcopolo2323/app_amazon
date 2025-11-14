import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { useOrdersStore } from "../stores/orders";

interface PaymentForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export default function PaymentScreen() {
  const router = useRouter();
  const { bookingId, amount } = useLocalSearchParams<{
    bookingId?: string;
    amount?: string;
  }>();
  const { updateOrder } = useOrdersStore();

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState<PaymentForm>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });
  const [errors, setErrors] = useState<Partial<PaymentForm>>({});

  const paymentAmount = parseFloat(amount || "0");

  const formatCardNumber = (value: string): string => {
    // Remove all non-digit characters
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string): string => {
    // Remove all non-digit characters
    const v = value.replace(/\D/g, "");

    // Add slash after 2 digits
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }

    return v;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentForm> = {};

    // Card number validation
    const cardNumberDigits = form.cardNumber.replace(/\s/g, "");
    if (!cardNumberDigits) {
      newErrors.cardNumber = "El número de tarjeta es requerido";
    } else if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
      newErrors.cardNumber = "Número de tarjeta inválido";
    }

    // Expiry date validation
    if (!form.expiryDate) {
      newErrors.expiryDate = "La fecha de vencimiento es requerida";
    } else if (!/^\d{2}\/\d{2}$/.test(form.expiryDate)) {
      newErrors.expiryDate = "Formato inválido (MM/AA)";
    } else {
      const [month, year] = form.expiryDate.split("/");
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;

      const expMonth = parseInt(month, 10);
      const expYear = parseInt(year, 10);

      if (expMonth < 1 || expMonth > 12) {
        newErrors.expiryDate = "Mes inválido";
      } else if (
        expYear < currentYear ||
        (expYear === currentYear && expMonth < currentMonth)
      ) {
        newErrors.expiryDate = "Tarjeta vencida";
      }
    }

    // CVV validation
    if (!form.cvv) {
      newErrors.cvv = "El CVV es requerido";
    } else if (!/^\d{3,4}$/.test(form.cvv)) {
      newErrors.cvv = "CVV inválido (3-4 dígitos)";
    }

    // Cardholder name validation
    if (!form.cardholderName.trim()) {
      newErrors.cardholderName = "El nombre del titular es requerido";
    } else if (form.cardholderName.trim().length < 2) {
      newErrors.cardholderName = "Nombre muy corto";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PaymentForm, value: string) => {
    let formattedValue = value;

    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value);
      // Limit to 19 characters (16 digits + 3 spaces)
      if (formattedValue.length > 19) return;
    } else if (field === "expiryDate") {
      formattedValue = formatExpiryDate(value);
      // Limit to 5 characters (MM/YY)
      if (formattedValue.length > 5) return;
    } else if (field === "cvv") {
      // Only allow digits and limit to 4 characters
      formattedValue = value.replace(/\D/g, "").substring(0, 4);
    } else if (field === "cardholderName") {
      // Allow only letters and spaces
      formattedValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setForm((prev) => ({ ...prev, [field]: formattedValue }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getCardType = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, "");

    if (/^4/.test(number)) return "visa";
    if (/^5[1-5]/.test(number)) return "mastercard";
    if (/^3[47]/.test(number)) return "amex";
    if (/^6(?:011|5)/.test(number)) return "discover";

    return "unknown";
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor corrige los errores en el formulario");
      return;
    }

    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock payment data
      const transactionId = `txn_${Date.now()}`;
      const paymentData = {
        bookingId,
        amount: paymentAmount,
        cardNumber: form.cardNumber.slice(-4), // Only store last 4 digits
        cardType: getCardType(form.cardNumber),
        status: "completed",
        transactionId,
        timestamp: new Date().toISOString(),
      };

      // Update order with transaction ID and confirmed status
      if (bookingId) {
        updateOrder(bookingId, {
          status: "confirmed",
          transactionId: transactionId,
        });
      }

      console.log("Payment processed:", paymentData);

      // Navigate to confirmation screen
      router.push({
        pathname: "/order-confirmation",
        params: {
          bookingId: String(bookingId || ""),
          paymentMethod: "mercado_pago",
          transactionId: transactionId,
          success: "true",
        },
      });
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Error de Pago",
        "No se pudo procesar el pago. Verifica tus datos e intenta de nuevo.",
        [{ text: "OK" }],
      );
    } finally {
      setProcessing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={processing}
      >
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Pago Seguro</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderPaymentSummary = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
        <Text style={styles.summaryTitle}>Pago Seguro</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Total a pagar:</Text>
        <Text style={styles.amountValue}>
          ${paymentAmount.toLocaleString()}
        </Text>
      </View>

      <View style={styles.securityNote}>
        <Ionicons name="lock-closed" size={16} color="#6B7280" />
        <Text style={styles.securityText}>
          Tu información está protegida con encriptación SSL
        </Text>
      </View>
    </Card>
  );

  const renderCardForm = () => (
    <Card style={styles.formCard}>
      <Text style={styles.sectionTitle}>Información de la tarjeta</Text>

      <Input
        label="Número de tarjeta"
        placeholder="1234 5678 9012 3456"
        value={form.cardNumber}
        onChangeText={(value) => handleInputChange("cardNumber", value)}
        error={errors.cardNumber}
        leftIcon="card-outline"
        keyboardType="numeric"
        maxLength={19}
        required
      />

      <View style={styles.cardDetailsRow}>
        <Input
          label="Vencimiento"
          placeholder="MM/AA"
          value={form.expiryDate}
          onChangeText={(value) => handleInputChange("expiryDate", value)}
          error={errors.expiryDate}
          leftIcon="calendar-outline"
          keyboardType="numeric"
          maxLength={5}
          style={styles.expiryInput}
          required
        />

        <Input
          label="CVV"
          placeholder="123"
          value={form.cvv}
          onChangeText={(value) => handleInputChange("cvv", value)}
          error={errors.cvv}
          leftIcon="shield-outline"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          style={styles.cvvInput}
          required
        />
      </View>

      <Input
        label="Nombre del titular"
        placeholder="Como aparece en la tarjeta"
        value={form.cardholderName}
        onChangeText={(value) => handleInputChange("cardholderName", value)}
        error={errors.cardholderName}
        leftIcon="person-outline"
        autoCapitalize="words"
        required
      />

      <View style={styles.acceptedCards}>
        <Text style={styles.acceptedCardsText}>Tarjetas aceptadas:</Text>
        <View style={styles.cardLogos}>
          <View style={[styles.cardLogo, styles.visaLogo]}>
            <Text style={styles.cardLogoText}>VISA</Text>
          </View>
          <View style={[styles.cardLogo, styles.mastercardLogo]}>
            <Text style={styles.cardLogoText}>MC</Text>
          </View>
          <View style={[styles.cardLogo, styles.amexLogo]}>
            <Text style={styles.cardLogoText}>AMEX</Text>
          </View>
        </View>
      </View>
    </Card>
  );

  const renderPaymentButton = () => (
    <View style={styles.paymentContainer}>
      <Button
        onPress={handlePayment}
        loading={processing}
        disabled={processing}
        style={styles.paymentButton}
      >
        {processing
          ? "Procesando pago..."
          : `Pagar $${paymentAmount.toLocaleString()}`}
      </Button>

      <View style={styles.securityFooter}>
        <Ionicons name="shield-checkmark" size={16} color="#10B981" />
        <Text style={styles.securityFooterText}>
          Pago 100% seguro y encriptado
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <Screen safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea>
      <View style={styles.container}>
        {renderHeader()}

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderPaymentSummary()}
          {renderCardForm()}
          <View style={styles.spacer} />
        </ScrollView>

        {renderPaymentButton()}
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

  // Summary
  summaryCard: {
    padding: 20,
    marginBottom: 16,
    marginTop: 16,
    backgroundColor: "#F8FAFC",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 12,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 16,
    color: "#6B7280",
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563EB",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: "#10B981",
    marginLeft: 8,
    fontWeight: "500",
  },

  // Form
  formCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  cardDetailsRow: {
    flexDirection: "row",
    gap: 12,
  },
  expiryInput: {
    flex: 1,
  },
  cvvInput: {
    flex: 1,
  },
  acceptedCards: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  acceptedCardsText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  cardLogos: {
    flexDirection: "row",
    gap: 8,
  },
  cardLogo: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  visaLogo: {
    backgroundColor: "#1A1F71",
  },
  mastercardLogo: {
    backgroundColor: "#EB001B",
  },
  amexLogo: {
    backgroundColor: "#006FCF",
  },
  cardLogoText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },

  spacer: {
    height: 20,
  },

  // Payment Button
  paymentContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  paymentButton: {
    width: "100%",
    marginBottom: 12,
  },
  securityFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  securityFooterText: {
    fontSize: 12,
    color: "#10B981",
    marginLeft: 6,
    fontWeight: "500",
  },
});
