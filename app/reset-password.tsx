import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../components/Screen";
import Input from "../components/Input";
import Button from "../components/Button";
import Card from "../components/Card";
import Toast from "react-native-toast-message";
import { Api } from "../lib/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();

  const [email, setEmail] = useState<string>(typeof params.email === "string" ? params.email : "");
  const [token, setToken] = useState<string>(typeof params.token === "string" ? params.token : "");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errors, setErrors] = useState<{ email?: string; token?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  const validate = () => {
    const nextErrors: { email?: string; token?: string; password?: string; confirmPassword?: string } = {};
    if (!email.trim()) nextErrors.email = "El correo electrónico es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Formato de correo inválido";
    if (!token.trim()) nextErrors.token = "El token es requerido";
    else if (token.length < 20) nextErrors.token = "Token inválido";
    if (!password.trim()) nextErrors.password = "La contraseña es requerida";
    else if (password.length < 6) nextErrors.password = "La contraseña debe tener al menos 6 caracteres";
    if (!confirmPassword.trim()) nextErrors.confirmPassword = "Confirma tu contraseña";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Las contraseñas no coinciden";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await Api.resetPasswordWithToken(email.trim(), token.trim(), password);
      Toast.show({ type: "success", text1: "Contraseña actualizada", text2: "Ya puedes iniciar sesión" });
      router.replace("/login");
    } catch (err: any) {
      const msg = err?.message || "No se pudo restablecer la contraseña";
      Toast.show({ type: "error", text1: "Error", text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.replace("/login");

  return (
    <Screen title="Restablecer contraseña" subtitle="Ingresa el token recibido y tu nueva contraseña" maxWidth={400}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.form}>
          <Card style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Text style={styles.infoText}>Abre el enlace del correo. Si no se auto-completa, copia el token y tu correo.</Text>
            </View>
          </Card>

          <Input
            label="Correo electrónico"
            placeholder="tu@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            error={errors.email}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            required
          />

          <Input
            label="Token"
            placeholder="Pega el token del enlace"
            value={token}
            onChangeText={(text) => {
              setToken(text);
              if (errors.token) setErrors((e) => ({ ...e, token: undefined }));
            }}
            error={errors.token}
            leftIcon="key-outline"
            autoCapitalize="none"
            autoCorrect={false}
            required
          />

          <Input
            label="Nueva contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
            leftIcon="lock-closed-outline"
            secureTextEntry
            showPasswordToggle
            required
          />

          <Input
            label="Confirmar contraseña"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
            }}
            error={errors.confirmPassword}
            leftIcon="lock-closed-outline"
            secureTextEntry
            showPasswordToggle
            required
          />

          <Button onPress={handleReset} loading={loading} style={styles.resetButton}>
            Cambiar contraseña
          </Button>

          <TouchableOpacity onPress={handleBack} style={styles.backToLoginButton}>
            <Text style={styles.backToLoginText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { flex: 1 },
  infoCard: { backgroundColor: "#F9FAFB", marginBottom: 24, padding: 16 },
  infoContent: { flexDirection: "row", alignItems: "flex-start" },
  infoText: { fontSize: 14, color: "#6B7280", lineHeight: 20, flex: 1 },
  resetButton: { marginTop: 8, marginBottom: 24 },
  backToLoginButton: { alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  backToLoginText: { fontSize: 16, color: "#6B7280" },
});