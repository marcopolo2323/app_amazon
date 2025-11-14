import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from "react-native";
import Screen from "../components/Screen";
import Card from "../components/Card";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFavoritesStore } from "../stores/favorites";

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, isFavorite, toggleFavorite, loadPersistedFavorites, isInitialized } = useFavoritesStore();

  useEffect(() => {
    if (!isInitialized) {
      loadPersistedFavorites();
    }
  }, [isInitialized, loadPersistedFavorites]);

  const renderItem = ({ item }: any) => (
    <Card style={styles.card}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/service-detail?id=${item.id}`)}
        accessibilityLabel={`Ver detalle de ${item.title}`}
      >
        <Image
          source={{ uri: item.image || "https://via.placeholder.com/120x90" }}
          style={styles.image}
        />
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          {item.category ? (
            <Text style={styles.category}>{item.category}</Text>
          ) : null}
          {typeof item.price !== "undefined" ? (
            <Text style={styles.price}>${item.price}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.heart}
          onPress={() => toggleFavorite(item)}
          accessibilityLabel={isFavorite(item.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Ionicons
            name={isFavorite(item.id) ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite(item.id) ? "#EF4444" : "#6B7280"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Card>
  );

  return (
    <Screen scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis favoritos</Text>
        <Text style={styles.headerSubtitle}>Tu colección de servicios guardados</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Aún no tienes favoritos</Text>
          <Text style={styles.emptySubtitle}>
            Pulsa el corazón en un servicio para guardarlo aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 75,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  category: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
    marginTop: 4,
  },
  heart: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
});