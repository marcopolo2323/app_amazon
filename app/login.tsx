import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import { useAuthStore } from "../stores/auth";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const loading = useAuthStore((state) => state.loading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  });

  React.useEffect(() => {
    console.log('=== GOOGLE AUTH CONFIG ===');
    console.log('Android Client ID:', process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ? 'Present' : 'Missing');
    console.log('iOS Client ID:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
    console.log('Web Client ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'Present' : 'Missing');
    console.log('Expo Client ID:', process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ? 'Present' : 'Missing');
    console.log('Request ready:', request ? 'Yes' : 'No');
  }, []);

  React.useEffect(() => {
    console.log('=== GOOGLE AUTH RESPONSE ===');
    console.log('Response type:', response?.type);
    console.log('Response:', JSON.stringify(response, null, 2));
    
    if (response?.type === "success") {
      const { authentication } = response;
      console.log('Authentication:', authentication);
      console.log('ID Token:', authentication?.idToken ? 'Present' : 'Missing');
      if (authentication?.idToken) {
        handleGoogleLogin(authentication.idToken);
      }
    } else if (response?.type === "error") {
      console.error('Google auth error:', response);
      Alert.alert("Error", "No se pudo iniciar sesión con Google. Intenta nuevamente.");
    } else if (response?.type === "cancel") {
      console.log('Google auth cancelled by user');
    }
  }, [response]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    try {
      const result = await login(email, password);
      if (result && result.user) {
        // Esperar un momento para que el store se actualice
        setTimeout(() => {
          switch (result.user.role) {
            case "admin":
              router.replace("/admin/dashboard");
              break;
            case "affiliate":
              router.replace("/affiliate/dashboard");
              break;
            default:
              router.replace("/(tabs)/home");
              break;
          }
        }, 100);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || error?.error || "Error al iniciar sesión";
      Alert.alert("Error", String(errorMessage));
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    console.log('=== HANDLE GOOGLE LOGIN ===');
    console.log('ID Token received:', idToken ? 'Yes' : 'No');
    console.log('ID Token length:', idToken?.length);
    
    try {
      console.log('Calling googleLogin from store...');
      const result = await googleLogin(idToken);
      console.log('Google login result:', result);
      
      if (result && result.user) {
        console.log('Login successful, user:', result.user);
        setTimeout(() => {
          switch (result.user.role) {
            case "admin":
              console.log('Navigating to admin dashboard');
              router.replace("/admin/dashboard");
              break;
            case "affiliate":
              console.log('Navigating to affiliate dashboard');
              router.replace("/affiliate/dashboard");
              break;
            default:
              console.log('Navigating to home');
              router.replace("/(tabs)/home");
              break;
          }
        }, 100);
      } else {
        console.error('No user in result:', result);
      }
    } catch (error: any) {
      console.error("=== GOOGLE LOGIN ERROR ===");
      console.error("Error object:", error);
      console.error("Error message:", error?.message);
      console.error("Error response:", error?.response);
      
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || error?.error || "Error al iniciar con Google";
      Alert.alert("Error", String(errorMessage));
    }
  };

  return (
    <Screen safeArea scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>
              Bienvenido de vuelta a Amazon Group
            </Text>
          </View>

          <Card style={styles.card}>
            <Input
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color="#666" />}
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/recover-password")}
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <Button
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            >
              Iniciar Sesión
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => {
                console.log('=== GOOGLE BUTTON PRESSED ===');
                console.log('Request available:', request ? 'Yes' : 'No');
                console.log('Loading:', loading);
                if (!request) {
                  console.error('Request not ready!');
                  Alert.alert('Error', 'Google Sign In no está listo. Intenta nuevamente.');
                  return;
                }
                console.log('Calling promptAsync...');
                promptAsync();
              }}
              disabled={!request || loading}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Continuar con Google</Text>
            </TouchableOpacity>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.footerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  card: {
    padding: 20,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#2563EB",
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 20,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 15,
    gap: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  footerLink: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
});
