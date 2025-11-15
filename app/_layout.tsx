import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../stores/auth";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const loadPersistedData = useAuthStore((state) => state.loadPersistedData);

  useEffect(() => {
    loadPersistedData().catch((error) => {
      console.error("Error loading persisted data:", error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="recover-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="filter" />
        <Stack.Screen name="service-detail" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="mercado-pago" />
        <Stack.Screen name="order-confirmation" />
        <Stack.Screen name="order-detail" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="affiliate" />
        <Stack.Screen name="admin/dashboard" />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </GestureHandlerRootView>
  );
}
