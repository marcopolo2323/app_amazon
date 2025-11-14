import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAuthStore } from "../stores/auth";
import useImageUpload from "../hooks/useImageUpload";

interface EditProfileForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  avatar?: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUserProfile, loading, isInitialized, loadPersistedData } = useAuthStore();
  const { pickAndUploadImage, takePhotoAndUpload } = useImageUpload();

  const [form, setForm] = useState<EditProfileForm>({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });

  const [errors, setErrors] = useState<Partial<EditProfileForm>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Asegura que el store de auth se inicialice si esta pantalla se abre directamente
    if (!isInitialized) {
      loadPersistedData();
    }
  }, [isInitialized, loadPersistedData]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  useEffect(() => {
    // Check if form has changes compared to original user data
    if (user) {
      const hasChanges =
        form.name !== (user.name || "") ||
        form.email !== (user.email || "") ||
        form.phone !== (user.phone || "") ||
        form.address !== (user.address || "") ||
        form.bio !== (user.bio || "") ||
        form.avatar !== (user.avatar || "");

      setHasChanges(hasChanges);
    }
  }, [form, user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<EditProfileForm> = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = "El nombre es requerido";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Formato de email inválido";
    }

    // Phone validation (optional but if provided, must be valid)
    if (form.phone.trim() && !/^\+?[\d\s\-()]+$/.test(form.phone)) {
      newErrors.phone = "Formato de teléfono inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EditProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor corrige los errores en el formulario");
      return;
    }

    if (!hasChanges) {
      Alert.alert("Sin cambios", "No hay cambios para guardar");
      return;
    }

    setSaving(true);

    try {
      // Update user profile using auth store
      await updateUserProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar || user?.avatar || "",
      });

      Alert.alert(
        "Perfil actualizado",
        "Tu perfil ha sido actualizado correctamente",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        "No se pudo actualizar tu perfil. Intenta de nuevo."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const goBackSafe = () => {
      if ((router as any).canGoBack?.()) {
        router.back();
      } else {
        router.push("/(tabs)/profile");
      }
    };

    if (hasChanges) {
      Alert.alert(
        "Descartar cambios",
        "¿Estás seguro de que quieres descartar los cambios?",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => goBackSafe(),
          },
        ]
      );
    } else {
      goBackSafe();
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      "Cambiar foto",
      "¿Cómo quieres cambiar tu foto de perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cámara",
          onPress: async () => {
            try {
              const result = await takePhotoAndUpload({ allowsEditing: true, quality: 0.8 });
              if (result) {
                setForm(prev => ({ ...prev, avatar: result.secure_url || result.url }));
              }
            } catch (err) {
              console.log("Error al tomar foto:", err);
            }
          },
        },
        {
          text: "Galería",
          onPress: async () => {
            try {
              const result = await pickAndUploadImage({ allowsEditing: true, quality: 0.8 });
              if (result) {
                setForm(prev => ({ ...prev, avatar: result.secure_url || result.url }));
              }
            } catch (err) {
              console.log("Error al seleccionar imagen:", err);
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Editar Perfil</Text>
      <TouchableOpacity
        style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!hasChanges || saving}
      >
        <Text
          style={[
            styles.saveText,
            !hasChanges && styles.saveTextDisabled,
          ]}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAvatarSection = () => (
    <Card style={styles.avatarSection}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleChangeAvatar}>
          {form.avatar ? (
            <Image source={{ uri: form.avatar }} style={styles.avatar} />
          ) : user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {form.name.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={16} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>Cambiar foto</Text>
      </View>
    </Card>
  );

  const renderForm = () => (
    <Card style={styles.formCard}>
      <Text style={styles.sectionTitle}>Información personal</Text>

      <Input
        label="Nombre completo"
        placeholder="Tu nombre completo"
        value={form.name}
        onChangeText={(value) => handleInputChange("name", value)}
        error={errors.name}
        leftIcon="person-outline"
        required
      />

      <Input
        label="Email"
        placeholder="tu@email.com"
        value={form.email}
        onChangeText={(value) => handleInputChange("email", value)}
        error={errors.email}
        leftIcon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        required
      />

      <Input
        label="Teléfono"
        placeholder="+1 234 567 8900"
        value={form.phone}
        onChangeText={(value) => handleInputChange("phone", value)}
        error={errors.phone}
        leftIcon="call-outline"
        keyboardType="phone-pad"
      />

      <Input
        label="Dirección"
        placeholder="Tu dirección completa"
        value={form.address}
        onChangeText={(value) => handleInputChange("address", value)}
        leftIcon="location-outline"
        multiline
        numberOfLines={2}
      />

      <Input
        label="Biografía"
        placeholder="Cuéntanos sobre ti (opcional)"
        value={form.bio}
        onChangeText={(value) => handleInputChange("bio", value)}
        leftIcon="document-text-outline"
        multiline
        numberOfLines={3}
        maxLength={200}
      />

      {form.bio.length > 0 && (
        <Text style={styles.charCount}>
          {form.bio.length}/200 caracteres
        </Text>
      )}
    </Card>
  );

  const renderAccountInfo = () => {
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

    return (
      <Card style={styles.accountCard}>
        <Text style={styles.sectionTitle}>Información de cuenta</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tipo de cuenta:</Text>
          <Text style={styles.infoValue}>{getRoleLabel(user.role)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Miembro desde:</Text>
          <Text style={styles.infoValue}>
            {new Date(user.createdAt || Date.now()).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {user.emailVerified !== undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email verificado:</Text>
            <View style={styles.verificationStatus}>
              <Ionicons
                name={user.emailVerified ? "checkmark-circle" : "close-circle"}
                size={16}
                color={user.emailVerified ? "#10B981" : "#EF4444"}
              />
              <Text
                style={[
                  styles.infoValue,
                  { color: user.emailVerified ? "#10B981" : "#EF4444" },
                ]}
              >
                {user.emailVerified ? "Verificado" : "No verificado"}
              </Text>
            </View>
          </View>
        )}
      </Card>
    );
  };

  if (!user) {
    if (!isInitialized || loading) {
      return (
        <Screen safeArea>
          <View style={styles.errorContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.errorText}>Cargando perfil...</Text>
          </View>
        </Screen>
      );
    }
    return (
      <Screen safeArea>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorTitle}>No hay usuario</Text>
          <Text style={styles.errorText}>
            Debes iniciar sesión para editar tu perfil
          </Text>
          <Button
            onPress={() => router.push("/login")}
            style={styles.loginButton}
          >
            Iniciar sesión
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea scrollable={false}>
      {renderHeader()}
      {Platform.OS === "web" ? (
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {renderAvatarSection()}
          {renderForm()}
          {renderAccountInfo()}
          <View style={styles.spacer} />
        </ScrollView>
      ) : (
        // Use KeyboardAwareScrollView on native to handle insets and auto-scrolling
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        React.createElement(require('react-native-keyboard-aware-scroll-view').KeyboardAwareScrollView, {
          enableOnAndroid: true,
          enableAutomaticScroll: true,
          scrollToOverflowEnabled: true,
          extraHeight: 100,
          extraScrollHeight: 24,
          keyboardOpeningTime: 0,
          contentContainerStyle: styles.contentContainer,
          keyboardShouldPersistTaps: 'always',
          showsVerticalScrollIndicator: false,
          nestedScrollEnabled: true,
        },
          renderAvatarSection(),
          renderForm(),
          renderAccountInfo(),
          React.createElement(View, { style: styles.spacer })
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 48,
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
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: "#6B7280",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  saveButton: {
    padding: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "600",
  },
  saveTextDisabled: {
    color: "#9CA3AF",
  },

  // Avatar Section
  avatarSection: {
    padding: 24,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563EB",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  changePhotoText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
    marginTop: 12,
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
    marginBottom: 16,
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },

  // Account Info
  accountCard: {
    padding: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  spacer: {
    height: 20,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
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
  loginButton: {
    minWidth: 120,
  },
});
