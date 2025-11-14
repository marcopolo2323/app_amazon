import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import RequireAuth from "../../components/auth/RequireAuth";
import { ThemedText } from "../../components/themed-text";
import { useAuthStore } from "../../stores/auth";
import { Api } from "../../lib/api";

const { width } = Dimensions.get("window");

interface DashboardStats {
  totalServices: number;
  activeServices: number;
  totalEarnings: number;
  monthlyEarnings: number;
  totalOrders: number;
  pendingOrders: number;
  rating: number;
  reviews: number;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

export default function AffiliateDashboardScreen() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalServices: 0,
    activeServices: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    rating: 0,
    reviews: 0,
  });

  const quickActions: QuickAction[] = [
    {
      id: "add-service",
      title: "Nuevo Servicio",
      icon: "add-circle-outline",
      color: "#10B981",
      route: "/affiliate/services/add",
    },
    {
      id: "my-services",
      title: "Mis Servicios",
      icon: "briefcase-outline",
      color: "#3B82F6",
      route: "/affiliate/services",
    },
    {
      id: "earnings",
      title: "Ganancias",
      icon: "wallet-outline",
      color: "#F59E0B",
      route: "/affiliate/earnings",
    },
    {
      id: "home",
      title: "Ir a Inicio",
      icon: "home-outline",
      color: "#10B981",
      route: "/(tabs)/home",
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (!token) return;
      const data = await Api.getAffiliateStats(token);
      setStats((prev) => ({
        ...prev,
        totalServices: data.totalServices || 0,
        activeServices: data.activeServices || 0,
        totalEarnings: data.totalEarnings || 0,
        monthlyEarnings: data.monthlyEarnings || 0,
        totalOrders: data.totalOrders || 0,
        pendingOrders: data.pendingOrders || 0,
        rating: data.rating || 0,
        reviews: data.totalReviews || 0,
      }));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  const renderWelcomeSection = () => (
    <Card style={styles.welcomeCard}>
      <View style={styles.welcomeContent}>
        <View style={styles.welcomeText}>
          <Text style={styles.welcomeTitle}>
            ¡Hola, {user?.name?.split(" ")[0]}! 👋
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Aquí tienes un resumen de tu actividad como afiliado
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={20} color="#F59E0B" />
          <Text style={styles.ratingText}>
            {stats.reviews > 0 ? stats.rating.toFixed(1) : "Sin calificar"}
          </Text>
          <Text style={styles.reviewsText}>
            ({stats.reviews} {stats.reviews === 1 ? "reseña" : "reseñas"})
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <Card style={{ ...styles.statCard, ...styles.statCardSmall }}>
          <View style={styles.statContent}>
            <View style={[styles.statIcon, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="briefcase-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{stats.activeServices}</Text>
              <Text style={styles.statLabel}>Servicios Activos</Text>
            </View>
          </View>
        </Card>

        <Card style={{ ...styles.statCard, ...styles.statCardSmall }}>
          <View style={styles.statContent}>
            <View style={[styles.statIcon, { backgroundColor: "#F0FDF4" }]}>
              <Ionicons name="cash-outline" size={24} color="#10B981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>
                ${stats.monthlyEarnings.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Este Mes</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.statsRow}>
        <Card style={{ ...styles.statCard, ...styles.statCardSmall }}>
          <View style={styles.statContent}>
            <View style={[styles.statIcon, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="receipt-outline" size={24} color="#F59E0B" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pedidos Pendientes</Text>
            </View>
          </View>
        </Card>

        <Card style={{ ...styles.statCard, ...styles.statCardSmall }}>
          <View style={styles.statContent}>
            <View style={[styles.statIcon, { backgroundColor: "#EDE9FE" }]}>
              <Ionicons name="trending-up-outline" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>
                ${stats.totalEarnings.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Total Ganado</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <ThemedText style={styles.sectionTitle}>Acciones rápidas</ThemedText>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionItem}
            onPress={() => handleQuickAction(action.route)}
            activeOpacity={0.7}
          >
            <Card style={styles.quickActionCard}>
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: `${action.color}15` },
                ]}
              >
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <Card style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <ThemedText style={styles.sectionTitle}>Actividad reciente</ThemedText>
        <TouchableOpacity onPress={() => router.push("/(tabs)/orders" as any)}>
          <Text style={styles.viewAllText}>Ver todo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activityList}>
        <View style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Servicio completado</Text>
            <Text style={styles.activityDescription}>
              Limpieza profunda - María García
            </Text>
            <Text style={styles.activityTime}>Hace 2 horas</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: "#F0FDF4" }]}>
            <Ionicons name="cash" size={20} color="#10B981" />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Pago recibido</Text>
            <Text style={styles.activityDescription}>
              $125.00 por servicio de jardinería
            </Text>
            <Text style={styles.activityTime}>Hace 4 horas</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="star" size={20} color="#F59E0B" />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Nueva reseña</Text>
            <Text style={styles.activityDescription}>
              5 estrellas - "Excelente servicio"
            </Text>
            <Text style={styles.activityTime}>Hace 6 horas</Text>
          </View>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <Screen safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <ThemedText style={styles.loadingText}>Cargando tu panel...</ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <RequireAuth roles={["affiliate"]}>
      <Screen
        title="Panel de Afiliado"
        subtitle="Resumen de tu actividad y accesos rápidos"
        safeArea
        scrollable
      >
        {renderWelcomeSection()}
        {renderStatsCards()}
        {renderQuickActions()}
        {renderRecentActivity()}
      </Screen>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  welcomeCard: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: "#2563EB",
  },
  welcomeContent: {
    flexDirection: "column",
  },
  welcomeText: {
    flex: 1,
    marginRight: 0,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#E0E7FF",
    lineHeight: 22,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: "#E0E7FF",
    marginLeft: 4,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    padding: 16,
  },
  statCardSmall: {
    flex: 1,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionItem: {
    width: (width - 48) / 2,
    marginBottom: 12,
  },
  quickActionCard: {
    padding: 20,
    alignItems: "center",
    minHeight: 100,
    justifyContent: "center",
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  activityCard: {
    padding: 20,
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  },
});
