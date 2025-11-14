import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Card from "../components/Card";
import { Api } from "../lib/api";
import { useAuthStore } from "../stores/auth";
import { useFavoritesStore } from "../stores/favorites";

interface Service {
  serviceId: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  locationText?: string;
  subType?: string;
  transaction?: string;
}

export default function FilterScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { token } = useAuthStore();
  const { isFavorite, toggleFavorite, loadPersistedFavorites, isInitialized: favsReady } = useFavoritesStore();

  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    category || "",
  );
  const [houseType, setHouseType] = useState<"normal" | "campo" | undefined>(
    undefined,
  );
  const [listingType, setListingType] = useState<"venta" | "alquiler" | undefined>(
    undefined,
  );

  const categories = [
    "Todas",
    "Casas",
    "Agua",
    "Taxis",
    "Hoteles",
    "Lugares",
    "Restaurantes",
    "Discotecas",
    "Decoración para fiestas",
    "Zapatos",
    "Ropa",
    "Servicios",
  ];

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const data = await Api.listServices(token || undefined);
        const mapped: Service[] = Array.isArray(data)
          ? data.map((s: any) => ({
              serviceId: s.serviceId,
              title: s.title,
              description: s.description,
              price: s.price,
              category: s.category,
              locationText: s.locationText,
              subType: s.subType,
              transaction: s.transaction,
            }))
          : [];
        setServices(mapped);
      } catch (error) {
        console.error("Error listando servicios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [token]);

  // Cargar favoritos para renderizar correctamente el estado del corazón
  useEffect(() => {
    if (!favsReady) {
      loadPersistedFavorites();
    }
  }, [favsReady, loadPersistedFavorites]);

  useEffect(() => {
     let filtered = services;
 
     if (selectedCategory && selectedCategory !== "Todas") {
       filtered = filtered.filter((service) =>
         service.category.toLowerCase().includes(selectedCategory.toLowerCase()),
       );
     }
 
     // Apply house subfilters when category is Casas
     const isCasas = selectedCategory
       ? selectedCategory.toLowerCase().includes("casa") || selectedCategory.toLowerCase() === "casas"
       : false;
     if (isCasas) {
       if (houseType) {
         const ht = houseType.toLowerCase();
         filtered = filtered.filter((service) => {
           const sub = (service.subType || "").toLowerCase();
           if (ht === "normal") {
             return sub.includes("normal") || sub.includes("casa") || sub.includes("urbano");
           }
           if (ht === "campo") {
             return sub.includes("campo") || sub.includes("campestre") || sub.includes("country");
           }
           return true;
         });
       }
       if (listingType) {
         const lt = listingType.toLowerCase();
         filtered = filtered.filter((service) => {
           const tx = (service.transaction || "").toLowerCase();
           if (lt === "venta") {
             return tx.includes("venta") || tx.includes("sell") || tx.includes("sale");
           }
           if (lt === "alquiler") {
             return tx.includes("alquiler") || tx.includes("renta") || tx.includes("rent");
           }
           return true;
         });
       }
     }
 
     if (searchQuery) {
       filtered = filtered.filter(
         (service) =>
           service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (service.description || "")
             .toLowerCase()
             .includes(searchQuery.toLowerCase()) ||
           service.category.toLowerCase().includes(searchQuery.toLowerCase()),
       );
     }
 
     setFilteredServices(filtered);
   }, [services, selectedCategory, searchQuery, houseType, listingType]);

  const handleServicePress = (service: Service) => {
    router.push({
      pathname: "/service-detail",
      params: {
        id: service.serviceId,
      },
    });
  };

  const getCityFromLocationText = (locationText?: string) => {
    if (!locationText) return "—";
    const parts = locationText.split(",").map((p) => p.trim());
    return parts.length > 1 ? parts[1] : parts[0] || "—";
  };

  const formatPrice = (amount: number) => `S/ ${amount.toFixed(2)}`;

  const renderServiceCard = (service: Service) => (
    <TouchableOpacity
      key={service.serviceId}
      onPress={() => handleServicePress(service)}
      activeOpacity={0.7}
    >
      <Card style={styles.serviceCard} shadow>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceTitle} numberOfLines={2}>
            {service.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={(e) => {
                e.stopPropagation?.();
                toggleFavorite({
                  id: service.serviceId,
                  title: service.title,
                  price: service.price,
                  image: '',
                  category: service.category,
                });
              }}
              accessibilityLabel={isFavorite(service.serviceId) ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Ionicons
                name={isFavorite(service.serviceId) ? 'heart' : 'heart-outline'}
                size={18}
                color={isFavorite(service.serviceId) ? '#EF4444' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {service.description ? (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}

        <View style={styles.serviceFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.locationText}>{getCityFromLocationText(service.locationText)}</Text>
          </View>
        </View>

      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Screen safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Cargando servicios...</Text>
        </View>
      </Screen>
    );
  }

  const renderHouseSubfilters = () => {
    const isCasasCategory = selectedCategory
      ? selectedCategory.toLowerCase().includes("casa") ||
        selectedCategory.toLowerCase() === "casas"
      : false;

    if (!isCasasCategory) return null;

    return (
      <Card style={styles.subfiltersCard}>
        <Text style={styles.subfiltersTitle}>Filtros de casas</Text>
        <View style={styles.subfiltersRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              houseType === "normal" && styles.filterPillSelected,
            ]}
            onPress={() => setHouseType(houseType === "normal" ? undefined : "normal")}
          >
            <Text
              style={[
                styles.filterPillText,
                houseType === "normal" && styles.filterPillTextSelected,
              ]}
            >
              Casa normal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterPill,
              houseType === "campo" && styles.filterPillSelected,
            ]}
            onPress={() => setHouseType(houseType === "campo" ? undefined : "campo")}
          >
            <Text
              style={[
                styles.filterPillText,
                houseType === "campo" && styles.filterPillTextSelected,
              ]}
            >
              Casa de campo
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.subfiltersRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              listingType === "venta" && styles.filterPillSelected,
            ]}
            onPress={() =>
              setListingType(listingType === "venta" ? undefined : "venta")
            }
          >
            <Text
              style={[
                styles.filterPillText,
                listingType === "venta" && styles.filterPillTextSelected,
              ]}
            >
              En venta
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterPill,
              listingType === "alquiler" && styles.filterPillSelected,
            ]}
            onPress={() =>
              setListingType(listingType === "alquiler" ? undefined : "alquiler")
            }
          >
            <Text
              style={[
                styles.filterPillText,
                listingType === "alquiler" && styles.filterPillTextSelected,
              ]}
            >
              En alquiler
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <Screen safeArea>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {selectedCategory ? selectedCategory : "Todos los servicios"}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar servicios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={styles.categoriesScrollView}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                selectedCategory === cat && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === cat && styles.categoryButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {renderHouseSubfilters()}

         <View style={styles.resultsHeader}>
           <Text style={styles.resultsCount}>
             {filteredServices.length} resultados
           </Text>
         </View>

        <ScrollView style={styles.servicesList}>
          <View style={styles.servicesGrid}>
            {filteredServices.map(renderServiceCard)}
          </View>
        </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#111827",
  },
  categoriesScrollView: {
    marginBottom: 16,
    flexGrow: 0,
  },
  categoriesContainer: {
    paddingHorizontal: 0,
    paddingRight: 8,
    paddingVertical: 0,
    alignItems: "center",
  },
  categoryButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    maxWidth: 120,
    overflow: "hidden",
  },
  categoryButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  categoryButtonText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
    flexShrink: 1,
    lineHeight: 14,
    includeFontPadding: false,
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
  },
  resultsHeader: {
    marginTop: 0,
    marginBottom: 12,
    paddingTop: 0,
  },
  resultsCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Añadidos: estilos para subfiltros de casas
  subfiltersCard: {
    padding: 16,
    marginBottom: 16,
  },
  subfiltersTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  subfiltersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterPillSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  filterPillText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  filterPillTextSelected: {
    color: "#FFFFFF",
  },
  servicesList: {
    flex: 1,
  },
  servicesGrid: {
    gap: 16,
    paddingBottom: 20,
  },
  serviceCard: {
    padding: 16,
    marginBottom: 0,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563EB",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    color: "#2563EB",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
