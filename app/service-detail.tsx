import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  LayoutChangeEvent,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import { Api } from "../lib/api";
import { useAuthStore } from "../stores/auth";
import { useFavoritesStore } from "../stores/favorites";

const { width } = Dimensions.get("window");

interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  price: string;
  priceNumeric: number;
  rating: number;
  reviews: number;
  category: string;
  location: string;
  provider: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    reviewsCount: number;
    joinedDate: string;
    verified: boolean;
  };
  images: string[];
  features: string[];
  availability: string;
  duration: string;
  includesInfo: string[];
  excludesInfo: string[];
  cancellationPolicy: string;
  contactInfo: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  reviewsList?: { rating?: number; comment?: string; user?: string }[];
}

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuthStore();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [galleryWidth, setGalleryWidth] = useState<number>(width);
  // reseñas
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState<number>(0);
  const [newReviewText, setNewReviewText] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [descExpanded, setDescExpanded] = useState<boolean>(false);
  const [policyExpanded, setPolicyExpanded] = useState<boolean>(false);

  const { isFavorite, toggleFavorite, loadPersistedFavorites, isInitialized: favsReady, setUserScope } = useFavoritesStore();

  useEffect(() => {
    // Cambiar el scope de favoritos cuando cambia el usuario
    setUserScope(user?.id);
  }, [user?.id, setUserScope]);

  useEffect(() => {
    if (!favsReady) {
      loadPersistedFavorites();
    }
  }, [favsReady, loadPersistedFavorites]);

  useEffect(() => {
    loadServiceDetail();
  }, [id]);

  const loadReviews = async (serviceId: string) => {
    if (!serviceId) return;
    setReviewsLoading(true);
    try {
      const reviewsData = await Api.listServiceReviews(serviceId, token || undefined);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      console.error("Error loading reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadServiceDetail = async () => {
    setLoading(true);
    try {
      const data = await Api.listServices(token || undefined);
      const s = Array.isArray(data)
        ? data.find((x: any) => String(x.serviceId || x._id) === String(id))
        : null;

      if (!s) {
        setService(null);
      } else {
        const mapped: ServiceDetail = {
            id: String(s.serviceId || s._id || id),
            title: s.title || "Servicio",
            description: s.description || "",
            fullDescription: s.description || "",
            priceNumeric: Number(s.price || 0),
            price: `S/ ${Number(s.price || 0).toFixed(2)}`,
            rating: Number(s.rating || 0),
            reviews: Array.isArray(s.reviews) ? s.reviews.length : Number(s.reviews || 0),
            category: s.category || "",
            location: s.locationText || (s.location?.city ?? ""),
            provider: {
              id: String(s.affiliateId || user?.id || ""),
              name: s.providerName || user?.name || "Proveedor",
              rating: 0,
              reviewsCount: 0,
              joinedDate: "",
              verified: true,
            },
            images: Array.isArray(s.images) ? s.images : [],
            features: Array.isArray(s.features) ? s.features : [],
            availability: "Disponible",
            duration: "",
            includesInfo: Array.isArray(s.includesInfo) ? s.includesInfo : [],
            excludesInfo: Array.isArray(s.excludesInfo) ? s.excludesInfo : [],
            cancellationPolicy: s.cancellationPolicy || "",
            contactInfo: {
              phone: s.contactPhone || undefined,
              email: s.contactEmail || user?.email || undefined,
              whatsapp: s.contactWhatsApp || undefined,
            },
            reviewsList: Array.isArray(s.reviews) ? s.reviews : [],
          };
        setService(mapped);
        // Load reviews from API
        await loadReviews(mapped.id);
      }
    } catch (error) {
      console.error("Error loading service detail:", error);
      Alert.alert("Error", "No se pudo cargar el detalle del servicio");
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!service) return;
    router.push({
      pathname: "/checkout",
      params: {
        serviceId: service.id,
        quantity: quantity.toString(),
        totalPrice: (service.priceNumeric * quantity).toString(),
      },
    });
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={size} color="#F59E0B" />);
    }

    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={size} color="#F59E0B" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={size} color="#D1D5DB" />
      );
    }

    return stars;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        Detalle del Servicio
      </Text>
      {service ? (
        <TouchableOpacity
          style={styles.favoriteButton}
          accessibilityRole="button"
          onPress={() =>
            toggleFavorite({
              id: service.id,
              title: service.title,
              price: service.price,
              image: service.images?.[0] || "",
              category: service.category,
            })
          }
        >
          <Ionicons
            name={isFavorite(service.id) ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite(service.id) ? "#EF4444" : "#6B7280"}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.favoriteButton} />
      )}
    </View>
  );

  const renderImageGallery = () => (
    <Card style={styles.imageGallery}>
      <View
        onLayout={(e: LayoutChangeEvent) => setGalleryWidth(e.nativeEvent.layout.width)}
        style={{ flex: 1, width: "100%" }}
      >
        {service && service.images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const index = Math.round(nativeEvent.contentOffset.x / galleryWidth);
              if (index !== activeImageIndex) setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
            style={{ width: "100%" }}
            contentContainerStyle={{}}
          >
            {service.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={{ width: galleryWidth, height: "100%" }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={80} color="#9CA3AF" />
            <Text style={styles.imagePlaceholderText}>Imagen del servicio</Text>
          </View>
        )}
        {service && service.images.length > 1 && (
          <View style={styles.imageIndicators}>
            {service.images.map((_, index) => (
              <View
                key={index}
                style={[styles.indicator, index === activeImageIndex && styles.indicatorActive]}
              />
            ))}
          </View>
        )}
      </View>
    </Card>
  );

  const renderServiceInfo = () => {
    if (!service) return null;

  return (
      <Card style={styles.serviceInfo}>
        <View style={styles.titleSection}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{service.category}</Text>
          </View>
        </View>

        <View style={styles.ratingSection}>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>{renderStars(service.rating)}</View>
            <Text style={styles.ratingText}>
              {service.rating} ({service.reviews} reseñas)
            </Text>
          </View>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.locationText}>{service.location}</Text>
          </View>
        </View>
        {/* Ubicación con mapa */}
        <View style={styles.mapSection}>
          {(() => {
            const addr = encodeURIComponent(service.location || "");
            const apiKey = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string) || "";
            const mapUrl = apiKey
              ? `https://maps.googleapis.com/maps/api/staticmap?center=${addr}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${addr}&key=${apiKey}`
              : "";
            return apiKey ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addr}`)}
              >
                <Image source={{ uri: mapUrl }} style={styles.mapImage} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addr}`)}
              >
                <Ionicons name="map-outline" size={18} color="#2563EB" />
                <Text style={styles.mapButtonText}>Ver en Google Maps</Text>
              </TouchableOpacity>
            );
          })()}
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.price}>{service.price}</Text>
          <Text style={styles.priceNote}>{service.duration}</Text>
        </View>

        <View style={styles.availabilitySection}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.availabilityText}>{service.availability}</Text>
        </View>
      </Card>
    );
  };

  const renderProvider = () => {
    if (!service) return null;

    const { provider } = service;

    return (
      <Card style={styles.providerCard}>
        <Text style={styles.sectionTitle}>Proveedor</Text>
        <View style={styles.providerInfo}>
          <View style={styles.providerAvatar}>
            <Ionicons name="person" size={32} color="#6B7280" />
          </View>
          <View style={styles.providerDetails}>
            <View style={styles.providerNameRow}>
              <Text style={styles.providerName}>{provider.name}</Text>
              {provider.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              )}
            </View>
            <View style={styles.providerRating}>
              <View style={styles.starsContainer}>{renderStars(provider.rating, 14)}</View>
              <Text style={styles.providerRatingText}>
                {provider.rating} ({provider.reviewsCount} reseñas)
              </Text>
            </View>
            <Text style={styles.providerJoined}>Miembro desde {provider.joinedDate}</Text>
          </View>
        </View>

        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactProvider("whatsapp")}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButton} onPress={() => handleContactProvider("phone")}>
            <Ionicons name="call-outline" size={20} color="#2563EB" />
            <Text style={styles.contactButtonText}>Llamar</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderDescription = () => {
    if (!service) return null;

    return (
      <Card style={styles.descriptionCard}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text
          style={styles.description}
          numberOfLines={descExpanded ? undefined : 4}
        >
          {service.fullDescription}
        </Text>
        {service.fullDescription && service.fullDescription.length > 160 && (
          <TouchableOpacity onPress={() => setDescExpanded((v) => !v)}>
            <Text style={styles.readMore}>{descExpanded ? 'Ver menos' : 'Ver más'}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.subsectionTitle}>Características</Text>
        <View style={styles.featuresList}>
          {service.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const renderIncludesExcludes = () => {
    if (!service) return null;

    return (
      <Card style={styles.includesCard}>
        <Text style={styles.sectionTitle}>¿Qué incluye?</Text>
        <View style={styles.includesList}>
          {service.includesInfo.map((item, index) => (
            <View key={index} style={styles.includeItem}>
              <Ionicons name="checkmark" size={16} color="#10B981" />
              <Text style={styles.includeText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.subsectionTitle}>No incluye</Text>
        <View style={styles.excludesList}>
          {service.excludesInfo.map((item, index) => (
            <View key={index} style={styles.excludeItem}>
              <Ionicons name="close" size={16} color="#EF4444" />
              <Text style={styles.excludeText}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const renderReviews = () => {
    if (!service) return null;

    return (
      <Card style={styles.reviewsCard}>
        <Text style={styles.sectionTitle}>Reseñas</Text>

        {reviewsLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.contactDescription}>Cargando reseñas...</Text>
          </View>
        ) : reviews.length > 0 ? (
          <View style={{ gap: 12 }}>
            {reviews.map((r: any, idx: number) => (
              <View key={idx} style={styles.reviewItem}>
                <View style={styles.starsContainer}>{renderStars(Number(r?.rating ?? 5), 14)}</View>
                <Text style={styles.reviewComment}>{String(r?.comment ?? "")}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.contactDescription}>Aún no hay reseñas.</Text>
        )}

        <View style={styles.addReviewSection}>
          <Text style={styles.subsectionTitle}>Agregar reseña</Text>
          <View style={styles.reviewStarsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setNewReviewRating(n)}>
                <Ionicons
                  name={n <= newReviewRating ? "star" : "star-outline"}
                  size={20}
                  color="#F59E0B"
                />
              </TouchableOpacity>
            ))}
          </View>
          <Input
            placeholder="Escribe tu opinión..."
            value={newReviewText}
            onChangeText={setNewReviewText}
          />
          <Button 
            onPress={handleSubmitReview} 
            style={styles.addReviewButton}
            disabled={submittingReview}
          >
            {submittingReview ? "Enviando..." : "Enviar reseña"}
          </Button>
        </View>
      </Card>
    );
  };

  const renderPolicies = () => {
    if (!service) return null;

    return (
      <Card style={styles.policiesCard}>
        <Text style={styles.sectionTitle}>Políticas</Text>
        <View style={styles.policyItem}>
          <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
          <Text
            style={styles.policyText}
            numberOfLines={policyExpanded ? undefined : 3}
          >
            {service.cancellationPolicy}
          </Text>
        </View>
        {service.cancellationPolicy && service.cancellationPolicy.length > 140 && (
          <TouchableOpacity onPress={() => setPolicyExpanded((v) => !v)}>
            <Text style={styles.readMore}>{policyExpanded ? 'Ver menos' : 'Ver más'}</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  const handleContactProvider = async (method: "phone" | "email" | "whatsapp") => {
    if (!service) return;

    const { contactInfo } = service;
    const message = `Hola, estoy interesado en tu servicio: ${service.title}`;

    const sanitizePhone = (raw?: string) => {
      const digits = (raw || "").replace(/\D/g, "");
      if (!digits) return "";
      if (raw?.startsWith("+")) return `+${digits}`;
      if (digits.length === 11 && digits.startsWith("51")) return `+${digits}`;
      if (digits.length === 9 && digits.startsWith("9")) return `+51${digits}`;
      return digits.startsWith("0") ? `+${digits.slice(1)}` : `+${digits}`;
    };

    switch (method) {
      case "phone": {
        const phone = sanitizePhone(contactInfo.phone);
        if (!phone) {
          Alert.alert("Llamar", "No hay número de teléfono disponible.");
          return;
        }
        const url = `tel:${phone}`;
        const can = await Linking.canOpenURL(url);
        if (!can) {
          Alert.alert("Llamar", "No se puede abrir el marcador en este dispositivo.");
          return;
        }
        Linking.openURL(url);
        break;
      }
      case "whatsapp": {
        const wa = sanitizePhone(contactInfo.whatsapp || contactInfo.phone);
        if (!wa) {
          Alert.alert("WhatsApp", "No hay número de WhatsApp disponible.");
          return;
        }
        const url = `https://wa.me/${wa.replace("+", "")}?text=${encodeURIComponent(message)}`;
        const can = await Linking.canOpenURL(url);
        if (!can) {
          Alert.alert("WhatsApp", "No se puede abrir WhatsApp en este dispositivo.");
          return;
        }
        Linking.openURL(url);
        break;
      }
      case "email": {
        const email = contactInfo.email || "";
        if (!email) {
          Alert.alert("Email", "No hay correo electrónico disponible.");
          return;
        }
        const url = `mailto:${email}?subject=${encodeURIComponent(service.title)}&body=${encodeURIComponent(message)}`;
        const can = await Linking.canOpenURL(url);
        if (!can) {
          Alert.alert("Email", "No se puede abrir el cliente de correo.");
          return;
        }
        Linking.openURL(url);
        break;
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!service || !token || !user) {
      Alert.alert("Error", "Debes iniciar sesión para enviar una reseña.");
      return;
    }
    if (!newReviewRating || newReviewRating < 1) {
      Alert.alert("Reseña", "Por favor selecciona una calificación de estrellas.");
      return;
    }
    if (!newReviewText || newReviewText.trim().length < 3) {
      Alert.alert("Reseña", "Por favor escribe un comentario más detallado.");
      return;
    }

    setSubmittingReview(true);
    try {
      await Api.createReview(token, {
        serviceId: service.id,
        rating: newReviewRating,
        comment: newReviewText.trim(),
      });
      
      // Reload reviews to show the new one
      await loadReviews(service.id);
      
      setNewReviewRating(0);
      setNewReviewText("");
      Alert.alert("Gracias", "Tu reseña ha sido agregada.");
    } catch (error: any) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", error.message || "No se pudo enviar la reseña. Inténtalo de nuevo.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <Screen safeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Cargando detalle...</Text>
        </View>
      </Screen>
    );
  }

  if (!service) {
    return (
      <Screen safeArea>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Servicio no encontrado</Text>
          <Text style={styles.errorText}>No se pudo cargar la información del servicio</Text>
          <Button onPress={() => router.back()} variant="outline" style={styles.backToListButton}>
            Volver
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea>
      <View style={styles.container}>
        {renderHeader()}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderImageGallery()}
          {renderServiceInfo()}
          {renderProvider()}
          {renderDescription()}
          {renderIncludesExcludes()}
          {renderReviews()}
          {renderPolicies()}
          <View style={styles.spacer} />
        </ScrollView>

        <View style={styles.bottomSheet}>
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Cantidad/Duración</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity(quantity + 1)}>
                <Ionicons name="add" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.totalPriceContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>
              {`S/ ${(service.priceNumeric * quantity).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            </Text>
          </View>
          
          <Button onPress={handleBookNow} style={styles.bookButton}>
            Reservar Ahora
          </Button>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
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
  backToListButton: {
    minWidth: 120,
  },

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
  favoriteButton: {
    padding: 8,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  imageGallery: {
    height: 200,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignSelf: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: "#2563EB",
  },

  serviceInfo: {
    padding: 20,
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
  },
  ratingSection: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
    flexShrink: 1,
   },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563EB",
  },
  priceNote: {
    fontSize: 14,
    color: "#6B7280",
  },
  availabilitySection: {
    flexDirection: "row",
    alignItems: "center",
  },
  availabilityText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
    marginLeft: 8,
  },

  providerCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  providerInfo: {
    flexDirection: "row",
    marginBottom: 16,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  providerDetails: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginRight: 8,
  },
  providerRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  providerRatingText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  providerJoined: {
    fontSize: 12,
    color: "#9CA3AF",
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

  descriptionCard: {
    padding: 20,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 20,
  },
  readMore: {
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
  },

  includesCard: {
    padding: 20,
    marginBottom: 16,
  },
  includesList: {
    gap: 8,
    marginBottom: 20,
  },
  includeItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  includeText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
  },
  excludesList: {
    gap: 8,
  },
  excludeItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  excludeText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 12,
  },

  policiesCard: {
    padding: 20,
    marginBottom: 16,
  },
  policyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  policyText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },

  spacer: {
    height: 20,
  },

  bottomSheet: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#ffffff",
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    color: "#111827",
  },
  bookingSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalPriceContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  bookButton: {
    minWidth: 120,
    flexShrink: 0,
    marginTop: 12,
    width: "100%",
  },

  // Reviews styles
  reviewsCard: {
    padding: 20,
    marginBottom: 16,
  },
  reviewItem: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
  },
  reviewComment: {
    fontSize: 14,
    color: "#374151",
    marginTop: 8,
  },
  addReviewSection: {
    marginTop: 16,
    gap: 12,
  },
  reviewStarsRow: {
    flexDirection: "row",
    gap: 4,
  },
  addReviewButton: {
    marginTop: 8,
  },
  contactDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 8,
  },
  mapSection: {
    marginBottom: 16,
  },
  mapImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2563EB",
    marginLeft: 8,
  },
});