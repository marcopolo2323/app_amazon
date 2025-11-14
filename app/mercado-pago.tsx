import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

export default function MercadoPagoScreen() {
  const router = useRouter();
  const { bookingId, orderId: orderIdParam, amount, serviceId } = useLocalSearchParams<{
    bookingId?: string;
    orderId?: string;
    amount?: string;
    serviceId?: string;
  }>();
  const { updateOrder } = useOrdersStore();
  const { token } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const paymentAmount = parseFloat(amount || "0");

  useEffect(() => {
    generatePaymentUrl();
  }, []);

  const generatePaymentUrl = async () => {
    setLoading(true);
    try {
      const orderId = String(orderIdParam || bookingId || "");
      let pref: any;
      if (orderId) {
        // Preferido: usar la orden ya creada en checkout
        pref = await Api.createMercadoPagoPreference(token || "", {
          orderId,
        });
      } else {
        if (!serviceId) throw new Error("Falta serviceId para crear preferencia");
        // Fallback: aún así intentamos con serviceId (backend requerirá datos si crea orden)
        pref = await Api.createMercadoPagoPreference(token || "", {
          serviceId: String(serviceId),
        });
      }
      const initPoint = pref?.init_point || pref?.sandbox_init_point || pref?.url;
      if (!initPoint) throw new Error("Preferencia creada sin URL inicial");
      setPaymentUrl(initPoint);
    } catch (error) {
      console.error("Error creando preferencia MP:", error);
      Alert.alert(
        "Error",
        "No se pudo iniciar el pago con Mercado Pago. Verifica tu configuración.",
        [{ text: "OK" }],
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithMercadoPago = async () => {
    if (!paymentUrl) return;

    setProcessing(true);

    try {
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        await Linking.openURL(paymentUrl);
        Alert.alert(
          "Redirigiendo a MercadoPago",
          "Se abrirá MercadoPago para completar tu pago. Regresa a la app después de completar el pago.",
          [
            {
              text: "Pago completado",
              onPress: () => handlePaymentCompleted(),
            },
            {
              text: "Cancelar pago",
              style: "cancel",
              onPress: () => setProcessing(false),
            },
          ],
        );
      } else {
        throw new Error("No se puede abrir MercadoPago");
      }
    } catch (error) {
      console.error("Error opening MercadoPago:", error);
      Alert.alert(
        "Error",
        "No se pudo abrir MercadoPago. Verifica que tengas la app instalada.",
        [{ text: "OK" }],
      );
      setProcessing(false);
    }
  };

  const handlePaymentCompleted = async () => {
    try {
      // En real, la confirmación llega por back_urls/webhook. Aquí solo navegamos.
      const transactionId = `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (bookingId) {
        updateOrder(String(bookingId), {
          status: "confirmed",
          transactionId: transactionId,
        });
      }
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
      console.error("Error verifying payment:", error);
      Alert.alert(
        "Error",
        "No se pudo verificar el pago. Contacta con soporte si el pago fue exitoso.",
        [{ text: "OK" }],
      );
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentFailed = () => {
    Alert.alert(
      "Pago Fallido",
      "Tu pago no pudo ser procesado. ¿Quieres intentar de nuevo?",
      [
        { text: "Intentar de nuevo", onPress: () => handlePayWithMercadoPago() },
        { text: "Cancelar", style: "cancel", onPress: () => router.back() },
      ]
    );
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
      <Text style={styles.headerTitle}>MercadoPago</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderPaymentSummary = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={styles.mercadoPagoLogo}>
          <Text style={styles.logoText}>MP</Text>
        </View>
        <Text style={styles.summaryTitle}>Pago con MercadoPago</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Total a pagar:</Text>
        <Text style={styles.amountValue}>${paymentAmount.toLocaleString()}</Text>
      </View>

      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark" size={16} color="#009EE3" />
        <Text style={styles.securityText}>
          Pago 100% seguro con MercadoPago
        </Text>
      </View>
    </Card>
  );

  const renderPaymentMethods = () => (
    <Card style={styles.methodsCard}>
      <Text style={styles.sectionTitle}>Métodos disponibles</Text>

      <View style={styles.methodsList}>
        <View style={styles.methodItem}>
          <Ionicons name="card-outline" size={24} color="#009EE3" />
          <Text style={styles.methodText}>Tarjetas de crédito y débito</Text>
        </View>

        <View style={styles.methodItem}>
          <Ionicons name="phone-portrait-outline" size={24} color="#009EE3" />
          <Text style={styles.methodText}>Yape, Plin y otros</Text>
        </View>

        <View style={styles.methodItem}>
          <Ionicons name="business-outline" size={24} color="#009EE3" />
          <Text style={styles.methodText}>Transferencia bancaria</Text>
        </View>

        <View style={styles.methodItem}>
          <Ionicons name="cash-outline" size={24} color="#009EE3" />
          <Text style={styles.methodText}>Efectivo en agentes</Text>
        </View>
      </View>
    </Card>
  );

  const renderInstructions = () => (
    <Card style={styles.instructionsCard}>
      <Text style={styles.sectionTitle}>Instrucciones</Text>

      <View style={styles.stepsList}>
        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>
            Haz clic en "Pagar con MercadoPago"
          </Text>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>
            Se abrirá MercadoPago en tu navegador
          </Text>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>
            Elige tu método de pago preferido
          </Text>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <Text style={styles.stepText}>
            Completa el pago y regresa a la app
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderPaymentButton = () => (
    <View style={styles.paymentContainer}>
      <Button
        onPress={handlePayWithMercadoPago}
        loading={processing}
        disabled={loading || processing || !paymentUrl}
        style={styles.paymentButton}
      >
        {processing ? "Procesando..." : `Pagar $${paymentAmount.toLocaleString()}`}
      </Button>

      <View style={styles.alternativeActions}>
        <TouchableOpacity
          style={styles.problemButton}
          onPress={handlePaymentFailed}
          disabled={processing}
        >
          <Text style={styles.problemButtonText}>
            Reportar problema con el pago
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.securityFooter}>
        <Ionicons name="shield-checkmark" size={16} color="#009EE3" />
        <Text style={styles.securityFooterText}>
          Transacción segura con MercadoPago
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <Screen safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009EE3" />
          <Text style={styles.loadingText}>Preparando pago...</Text>
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
          {renderPaymentMethods()}
          {renderInstructions()}
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
    backgroundColor: "#F0F8FF",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  mercadoPagoLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#009EE3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
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
    color: "#009EE3",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 158, 227, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: "#009EE3",
    marginLeft: 8,
    fontWeight: "500",
  },

  // Methods
  methodsCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  methodsList: {
    gap: 12,
  },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
  },

  // Instructions
  instructionsCard: {
    padding: 20,
    marginBottom: 16,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#009EE3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  stepText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
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
    marginBottom: 16,
    backgroundColor: "#009EE3",
  },
  alternativeActions: {
    alignItems: "center",
    marginBottom: 16,
  },
  problemButton: {
    padding: 12,
  },
  problemButtonText: {
    fontSize: 14,
    color: "#6B7280",
    textDecorationLine: "underline",
  },
  securityFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  securityFooterText: {
    fontSize: 12,
    color: "#009EE3",
    marginLeft: 6,
    fontWeight: "500",
  },
});
