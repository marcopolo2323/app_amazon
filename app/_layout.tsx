import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../stores/auth";
import "react-native-reanimated";
import { useColorScheme } from "../hooks/use-color-scheme";
import { Colors } from "../constants/theme";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const loadPersistedData = useAuthStore((state) => state.loadPersistedData);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const loading = useAuthStore((state) => state.loading);
  const theme = useColorScheme() ?? "light";

  // Initialize auth store on app start
  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  if (!isInitialized || loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[theme].background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={[styles.loadingText, { color: Colors[theme].text }]}>Cargando Amazon Group...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth & Onboarding Screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="recover-password" />

        {/* Main App Flow */}
        <Stack.Screen name="(tabs)" />

        {/* Filter Screen */}
        <Stack.Screen name="filter" options={{ headerShown: false }} />

        {/* Service Detail and Booking Flow */}
        <Stack.Screen name="service-detail" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen name="payment" options={{ headerShown: false }} />
        <Stack.Screen name="mercado-pago" options={{ headerShown: false }} />
        <Stack.Screen
          name="order-confirmation"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="order-detail" options={{ headerShown: false }} />

        {/* Profile Screens */}
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="favorites" options={{ headerShown: false }} />

        {/* Categories Screen */}
        <Stack.Screen name="categories" options={{ headerShown: false }} />

        {/* Modal Screens - Only include existing routes */}
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />

        {/* Affiliate routes are handled by app/affiliate/_layout.tsx (Tabs). */}

        {/* Admin Screens */}
        <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
      </Stack>

      <StatusBar style={theme === "dark" ? "light" : "dark"} backgroundColor={Colors[theme].background} />
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor is themed dynamically above
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    // color is themed dynamically above
    fontWeight: "500",
  },
});
