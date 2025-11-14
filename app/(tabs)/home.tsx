import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import { useAuthStore } from "../../stores/auth";

const { width } = Dimensions.get("window");

interface CategoryItem {
  label: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface HeroSlide {
  title: string;
  description: string;
  cta: {
    label: string;
    href: string;
  };
  color: string;
}

const categories: CategoryItem[] = [
  {
    label: "Casas",
    path: "/filter?category=Casas",
    icon: "home-outline",
    color: "#3B82F6",
  },
  {
    label: "Agua",
    path: "/filter?category=Agua",
    icon: "water-outline",
    color: "#06B6D4",
  },
  {
    label: "Taxis",
    path: "/filter?category=Taxi",
    icon: "car-outline",
    color: "#F59E0B",
  },
  {
    label: "Hoteles",
    path: "/filter?category=Hoteles",
    icon: "bed-outline",
    color: "#8B5CF6",
  },
  {
    label: "Lugares Turísticos",
    path: "/filter?category=Lugares",
    icon: "location-outline",
    color: "#EF4444",
  },
  {
    label: "Restaurantes",
    path: "/filter?category=Restaurantes",
    icon: "restaurant-outline",
    color: "#F97316",
  },
  {
    label: "Discotecas",
    path: "/filter?category=Discotecas",
    icon: "musical-notes-outline",
    color: "#EC4899",
  },
  {
    label: "Decoración",
    path: "/filter?category=Decoración para fiestas",
    icon: "gift-outline",
    color: "#10B981",
  },
  {
    label: "Zapatos",
    path: "/filter?category=Zapatos",
    icon: "footsteps-outline",
    color: "#6366F1",
  },
  {
    label: "Ropa",
    path: "/filter?category=Ropa",
    icon: "shirt-outline",
    color: "#84CC16",
  },
  {
    label: "Servicios",
    path: "/filter",
    icon: "briefcase-outline",
    color: "#059669",
  },
];

const heroSlides: HeroSlide[] = [
  {
    title: "Servicios cercanos",
    description: "Profesionales y experiencias en tu ciudad",
    cta: { label: "Explorar", href: "/filter" },
    color: "#2563EB",
  },
  {
    title: "Casas y alquileres",
    description: "Encuentra tu próximo hogar",
    cta: { label: "Ver casas", href: "/filter?category=Casas" },
    color: "#10B981",
  },
  {
    title: "Viajes y turismo",
    description: "Paquetes para tu próxima aventura",
    cta: {
      label: "Ver paquetes",
      href: "/filter?category=Paquetes%20turísticos",
    },
    color: "#F59E0B",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const firstName = user?.name ? user.name.split(" ")[0] : "";

  const handleCategoryPress = (path: string) => {
    router.push(path as any);
  };

  const handleHeroCTA = (href: string) => {
    router.push(href as any);
  };

  const renderCategoryItem = (item: CategoryItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item.path)}
      activeOpacity={0.7}
    >
      <Card style={styles.categoryCard} shadow>
        <View
          style={[styles.categoryIcon, { backgroundColor: `${item.color}15` }]}
        >
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        <Text style={styles.categoryLabel} numberOfLines={2}>
          {item.label}
        </Text>
      </Card>
    </TouchableOpacity>
  );

  const renderHeroSlide = () => {
    const slide = heroSlides[currentSlide];
    return (
      <Card style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <View style={[styles.heroBadge, { backgroundColor: `${slide.color}20` }]}>
              <Text style={[styles.heroBadgeText, { color: slide.color }]}>Recomendado</Text>
            </View>
            <Text style={styles.heroTitle}>{slide.title}</Text>
            <Text style={styles.heroDescription}>{slide.description}</Text>
            <TouchableOpacity
              style={[styles.heroButton, { backgroundColor: slide.color }]}
              onPress={() => handleHeroCTA(slide.cta.href)}
            >
              <Text style={styles.heroButtonText}>{slide.cta.label}</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroImage}>
            <View style={styles.heroImagePlaceholder}>
              <Ionicons
                name={
                  currentSlide === 0
                    ? "search-outline"
                    : currentSlide === 1
                    ? "home-outline"
                    : "airplane-outline"
                }
                size={60}
                color={slide.color}
              />
            </View>
          </View>
        </View>

        {/* Pagination dots */}
        <View style={styles.heroPagination}>
          {heroSlides.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.heroDot,
                index === currentSlide && styles.heroDotActive,
              ]}
              onPress={() => setCurrentSlide(index)}
            />
          ))}
        </View>
      </Card>
    );
  };

  return (
    <Screen scrollable safeArea>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola{firstName ? `, ${firstName}` : ""}!</Text>
            <Text style={styles.subtitle}>¿Qué necesitas hoy?</Text>
          </View>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Ionicons name="log-in-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        {renderHeroSlide()}

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Explora categorías</Text>
          <View style={styles.categoriesGrid}>
            {categories.map(renderCategoryItem)}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Acceso rápido</Text>
          <View style={styles.quickActionsList}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/filter")}
            >
              <Ionicons name="grid-outline" size={20} color="#2563EB" />
              <Text style={styles.quickActionText}>Explorar servicios</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push("/register")}
            >
              <Ionicons name="person-add-outline" size={20} color="#2563EB" />
              <Text style={styles.quickActionText}>Crear cuenta</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },
  loginButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },

  // Hero Section
  heroCard: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
  },
  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroText: {
    flex: 2,
    marginRight: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  heroButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 8,
  },
  heroImage: {
    flex: 1,
    alignItems: "center",
  },
  heroImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroPagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },
  heroDotActive: {
    backgroundColor: "#2563EB",
    width: 20,
  },

  // Categories Section
  categoriesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryItem: {
    width: (width - 48) / 3, // 3 columns with padding
    marginBottom: 16,
  },
  categoryCard: {
    padding: 16,
    alignItems: "center",
    minHeight: 90,
    justifyContent: "center",
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
  },

  // Quick Actions
  quickActions: {
    marginBottom: 32,
  },
  quickActionsList: {
    gap: 12,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickActionText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    marginLeft: 12,
  },
});
