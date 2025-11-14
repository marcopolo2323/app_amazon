import React, { useState, useEffect } from "react";
  import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
  } from "react-native";
  import { useRouter } from "expo-router";
  import { Ionicons } from "@expo/vector-icons";
  import Screen from "../components/Screen";
  import Input from "../components/Input";
  import Button from "../components/Button";
  import { ExternalLink } from "../components/external-link";
  import { useAuthStore } from "../stores/auth";

  import * as WebBrowser from "expo-web-browser";
  import * as Google from "expo-auth-session/providers/google";
  import { makeRedirectUri } from "expo-auth-session";

  WebBrowser.maybeCompleteAuthSession();

  export default function LoginScreen() {
    const router = useRouter();
    const { login, googleLogin, loading } = useAuthStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const termsUrl = process.env.EXPO_PUBLIC_TERMS_URL as string | undefined;
    const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_URL as string | undefined;

    // Configuración del request de Google con IDs por plataforma
    const expoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID as string | undefined;
    const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID as string | undefined;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string | undefined;
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined;

    // Usar el proxy de Expo para tener un redirect HTTPS válido para Google
    const useProxy = true;
    const redirectUri = makeRedirectUri({ useProxy });

    const [request, response, promptAsync] = Google.useAuthRequest({
      expoClientId,
      androidClientId,
      iosClientId,
      webClientId,
      redirectUri,
      useProxy,
    });

    useEffect(() => {
      (async () => {
        if (response?.type === "success") {
          const idToken = response.authentication?.idToken || response.authentication?.id_token;
          if (idToken) {
            try {
              const data = await googleLogin(idToken);
              const role = data?.user?.role;
              if (role === "admin") {
                router.replace("/admin/dashboard");
              } else if (role === "affiliate") {
                router.replace("/affiliate/dashboard");
              } else {
                router.replace("/(tabs)/home");
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "No se pudo iniciar sesión con Google");
            }
          } else {
            Alert.alert("Error", "No se recibió idToken de Google");
          }
        }
      })();
    }, [response]);

    const handleLogin = async () => {
      try {
        const data = await login(email.trim().toLowerCase(), password);
        const role = data?.user?.role;
        if (role === "admin") {
          router.replace("/admin/dashboard");
        } else if (role === "affiliate") {
          router.replace("/affiliate/dashboard");
        } else {
          router.replace("/(tabs)/home");
        }
      } catch (err: any) {
        const message = err?.message || "No se pudo iniciar sesión";
        Alert.alert("Error", message);
      }
    };

    const handleRegister = () => {
      router.push("/register");
    };

    const handleForgotPassword = () => {
      router.push("/recover-password");
    };

    const handleGoogleLogin = async () => {
      try {
        // Validación según plataforma: Expo Go usa expoClientId; builds nativos usan android/ios; web usa webClientId
        const isAndroid = Platform.OS === "android";
        const isIOS = Platform.OS === "ios";
        const isWeb = Platform.OS === "web";

        if (isAndroid && !expoClientId && !androidClientId) {
          return Alert.alert(
            "Configurar Google",
            "Falta EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID (para Expo Go) o EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (para APK) en .env"
          );
        }

        if (isIOS && !expoClientId && !iosClientId) {
          return Alert.alert(
            "Configurar Google",
            "Falta EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID (para Expo Go) o EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (para IPA) en .env"
          );
        }

        if (isWeb && !webClientId) {
          return Alert.alert(
            "Configurar Google",
            "Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en .env"
          );
        }

        // Aseguramos que el prompt use el proxy de Expo
        await promptAsync({ useProxy });
      } catch (err: any) {
        Alert.alert("Error", err.message || "No se pudo iniciar con Google");
      }
    };

    return (
      <Screen>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

            <Input
              label="Correo"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              secureTextEntry
            />

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordButton}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <Button onPress={handleLogin} loading={loading} style={styles.loginButton}>
              Iniciar sesión
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={!request}>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Continuar con Google</Text>
            </TouchableOpacity>

            <View style={styles.registerSection}>
              <Text style={styles.registerText}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Regístrate</Text>
              </TouchableOpacity>
            </View>

            {(termsUrl || privacyUrl) && (
              <View style={styles.legalSection}>
                <Text style={styles.legalText}>Al continuar, aceptas nuestros </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {termsUrl && (
                    <ExternalLink href={termsUrl} style={styles.legalLink}>
                      Términos y condiciones
                    </ExternalLink>
                  )}
                  {termsUrl && privacyUrl && <Text style={styles.legalText}> y </Text>}
                  {privacyUrl && (
                    <ExternalLink href={privacyUrl} style={styles.legalLink}>
                      Política de privacidad
                    </ExternalLink>
                  )}
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
    subtitle: { fontSize: 16, color: "#6B7280", marginBottom: 16 },
    forgotPasswordButton: { alignSelf: "flex-end", marginBottom: 12 },
    forgotPasswordText: { color: "#2563EB" },
    loginButton: { marginTop: 8 },
    divider: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
    dividerText: { marginHorizontal: 8, color: "#6B7280" },
    googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingVertical: 12 },
    googleButtonText: { color: "#111827", fontWeight: "600", marginLeft: 8 },
    registerSection: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
    registerText: { color: "#6B7280" },
    registerLink: { color: "#2563EB", fontWeight: "600" },
    legalSection: { marginTop: 16, alignItems: "center" },
    legalText: { color: "#9CA3AF" },
    legalLink: { color: "#2563EB", fontWeight: "600" },
  });
