import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Card from "../components/Card";
import { useAuthStore } from "../stores/auth";
import { Api } from "../lib/api";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  servicesCount?: number;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock categories data - replace with API call
  const mockCategories: Category[] = [
    {
      id: "1",
      name: "Limpieza del hogar",
      description: "Servicios profesionales de limpieza",
      icon: "home-outline",
      color: "#3B82F6",
      servicesCount: 25,
    },
    {
      id: "2",
      name: "Reparaciones",
      description: "Plomería, electricidad y más",
      icon: "build-outline",
      color: "#F59E0B",
      servicesCount: 18,
    },
    {
      id: "3",
      name: "Jardinería",
      description: "Cuidado de jardines y plantas",
      icon: "leaf-outline",
      color: "#10B981",
      servicesCount: 12,
    },
    {
      id: "4",
      name: "Transporte",
      description: "Taxis y servicios de transporte",
      icon: "car-outline",
      color: "#8B5CF6",
      servicesCount: 30,
    },
    {
      id: "5",
      name: "Belleza y bienestar",
      description: "Peluquería, masajes y spa",
      icon: "flower-outline",
      color: "#EC4899",
      servicesCount: 22,
    },
    {
      id: "6",
      name: "Educación",
      description: "Clases particulares y tutorías",
      icon: "school-outline",
      color: "#6366F1",
      servicesCount: 15,
    },
    {
      id: "7",
      name: "Tecnología",
      description: "Reparación de equipos y desarrollo",
      icon: "laptop-outline",
      color: "#059669",
      servicesCount: 8,
    },
    {
      id: "8",
      name: "Eventos",
      description: "Organización y decoración de eventos",
      icon: "gift-outline",
      color: "#DC2626",
      servicesCount: 14,
    },
    {
      id: "9",
      name: "Mascotas",
      description: "Cuidado y servicios para mascotas",
      icon: "paw-outline",
      color: "#7C3AED",
      servicesCount: 9,
    },
    {
      id: "10",
      name: "Alimentación",
      description: "Catering y servicios de comida",
      icon: "restaurant-outline",
      color: "#F97316",
      servicesCount: 16,
    },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [searchQuery, categories]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      // For now, use mock data
      // const data = await Api.listCategories(token || undefined);
      setCategories(mockCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
      // Use mock data as fallback
      setCategories(mockCategories);
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredCategories(filtered);
  };

  const handleCategoryPress = (category: Category) => {
    // Navigate to services within this category
    router.push(`/category/${category.id}`);
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.categoryCard}>
        <View style={styles.categoryContent}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: `${item.color}15` },
            ]}
          >
            <Ionicons
              name={
                (item.icon as keyof typeof Ionicons.glyphMap) || "grid-outline"
              }
              size={28}
              color={item.color}
            />
          </View>

          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.categoryDescription}>{item.description}</Text>
            )}
            {item.servicesCount !== undefined && (
              <Text style={styles.servicesCount}>
                {item.servicesCount} servicios disponibles
              </Text>
            )}
          </View>

          <View style={styles.categoryArrow}>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar categorías..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.resultsText}>
        {filteredCategories.length} categoría
        {filteredCategories.length !== 1 ? "s" : ""} encontrada
        {filteredCategories.length !== 1 ? "s" : ""}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No se encontraron categorías</Text>
      <Text style={styles.emptyStateDescription}>
        Intenta con otros términos de búsqueda
      </Text>
      <TouchableOpacity
        style={styles.clearSearchButton}
        onPress={() => setSearchQuery("")}
      >
        <Text style={styles.clearSearchButtonText}>Limpiar búsqueda</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <Screen title="Categorías" safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Cargando categorías...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title="Categorías"
      subtitle="Encuentra el servicio que necesitas"
      safeArea
      scrollable={false}
    >
      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  resultsText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 20,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryCard: {
    padding: 0,
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    lineHeight: 20,
  },
  servicesCount: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  categoryArrow: {
    marginLeft: 8,
  },
  separator: {
    height: 8,
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  clearSearchButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
