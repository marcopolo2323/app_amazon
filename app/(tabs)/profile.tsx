import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Button from "../../components/Button";
import ImagePickerComponent from "../../components/ImagePicker";
import { useAuthStore } from "../../stores/auth";
import { router } from 'expo-router';

interface MenuOption {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showArrow?: boolean;
  color?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  const handleMyOrders = () => {
    router.push("/(tabs)/orders");
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleHelp = () => {
    Alert.alert("Ayuda", "Para soporte, contacta a: support@amazongroup.com", [
      { text: "OK" },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/");
          },
        },
      ],
    );
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleRegister = () => {
    router.push("/register");
  };

  const handleAvatarUpload = (images: any[]) => {
    if (images.length > 0) {
      const avatarUrl = images[0].url;
      // Update user avatar - you can implement this API call
      console.log("New avatar URL:", avatarUrl);
      // TODO: Call API to update user avatar
      // Api.updateMe(token, { avatar: avatarUrl });
    }
  };

  const menuOptions: MenuOption[] = user
    ? [
        {
          id: "edit-profile",
          title: "Editar perfil",
          subtitle: "Actualiza tu información personal",
          icon: "person-outline",
          onPress: handleEditProfile,
          showArrow: true,
        },
        {
          id: "favorites",
          title: "Mis favoritos",
          subtitle: "Servicios que te encantan",
          icon: "heart-outline",
          onPress: () => router.push("/favorites"),
          showArrow: true,
        },
        {
          id: "orders",
          title: "Mis pedidos",
          subtitle: "Ver historial de servicios",
          icon: "receipt-outline",
          onPress: handleMyOrders,
          showArrow: true,
        },
        {
          id: "settings",
          title: "Configuración",
          subtitle: "Notificaciones y preferencias",
          icon: "settings-outline",
          onPress: handleSettings,
          showArrow: true,
        },
        {
          id: "help",
          title: "Ayuda y soporte",
          subtitle: "Obtén ayuda cuando la necesites",
          icon: "help-circle-outline",
          onPress: handleHelp,
          showArrow: true,
        },
        {
          id: "logout",
          title: "Cerrar sesión",
          icon: "log-out-outline",
          onPress: handleLogout,
          showArrow: false,
          color: "#EF4444",
        },
      ]
    : [];

  const renderUserProfile = () => {
    if (!user) return null;

    const getRoleLabel = (role: string) => {
      switch (role) {
        case "client":
          return "Cliente";
        case "affiliate":
          return "Afiliado";
        case "admin":
          return "Administrador";
        default:
          return "Usuario";
      }
    };

    const getRoleColor = (role: string) => {
      switch (role) {
        case "client":
          return "#3B82F6";
        case "affiliate":
          return "#10B981";
        case "admin":
          return "#EF4444";
        default:
          return "#6B7280";
      }
    };

    return (
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: `${getRoleColor(user.role)}15` },
              ]}
            >
              <Text
                style={[styles.roleText, { color: getRoleColor(user.role) }]}
              >
                {getRoleLabel(user.role)}
              </Text>
            </View>

            {user.role === "affiliate" && (
              <TouchableOpacity
                style={styles.affiliateDashIcon}
                onPress={() => router.push("/affiliate/dashboard")}
                accessibilityLabel="Ir al Dashboard de Afiliado"
              >
                <Ionicons name="grid-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
              )}
          </View>
        </View>
      </Card>
    );
  };

  const renderMenuItem = (option: MenuOption) => (
    <TouchableOpacity
      key={option.id}
      style={styles.menuItem}
      onPress={option.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemLeft}>
          <View
            style={[
              styles.menuIcon,
              option.color && { backgroundColor: `${option.color}15` },
            ]}
          >
            <Ionicons
              name={option.icon}
              size={20}
              color={option.color || "#6B7280"}
            />
          </View>
          <View style={styles.menuItemText}>
            <Text
              style={[
                styles.menuTitle,
                option.color && { color: option.color },
              ]}
            >
              {option.title}
            </Text>
            {option.subtitle && (
              <Text style={styles.menuSubtitle}>{option.subtitle}</Text>
            )}
          </View>
        </View>
        {option.showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderGuestState = () => (
    <View style={styles.guestContainer}>
      <View style={styles.guestIcon}>
        <Ionicons name="person-outline" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.guestTitle}>¡Únete a Amazon Group!</Text>
      <Text style={styles.guestDescription}>
        Crea tu cuenta para acceder a todos los servicios y obtener una
        experiencia personalizada
      </Text>

      <View style={styles.guestActions}>
        <Button onPress={handleRegister} style={styles.registerButton}>
          Crear cuenta
        </Button>
        <Button
          variant="outline"
          onPress={handleLogin}
          style={styles.loginButton}
        >
          Iniciar sesión
        </Button>
      </View>

      <View style={styles.guestFeatures}>
        <Text style={styles.featuresTitle}>Con tu cuenta podrás:</Text>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>Ver tu historial de pedidos</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>
            Guardar tus servicios favoritos
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>
            Recibir notificaciones personalizadas
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.featureText}>Acceso a ofertas exclusivas</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Screen title={user ? "Mi perfil" : "Perfil"} safeArea>
      <ScrollView showsVerticalScrollIndicator={false}>
        {user ? (
          <View style={styles.container}>
            {renderUserProfile()}
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Configuración</Text>
              {menuOptions.map(renderMenuItem)}
            </View>
          </View>
        ) : (
          renderGuestState()
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    marginBottom: 24,
    padding: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  menuSection: {
    marginBottom: 32,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  guestIcon: {
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
  },
  guestDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  guestActions: {
    width: "100%",
    gap: 12,
    marginBottom: 40,
  },
  registerButton: {
    width: "100%",
  },
  loginButton: {
    width: "100%",
  },
  guestFeatures: {
    width: "100%",
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
  },
  affiliateDashIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
});
