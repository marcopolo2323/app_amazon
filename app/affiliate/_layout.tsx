import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/auth";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { Colors } from "../../constants/theme";

export default function AffiliateTabsLayout() {
  const router = useRouter();
  const { user } = useAuthStore();
  const theme = useColorScheme() ?? "light";

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "affiliate") {
      router.replace("/");
    }
  }, [user]);

  if (!user || user.role !== "affiliate") {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        tabBarInactiveTintColor: Colors[theme].icon,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors[theme].background,
          borderTopWidth: 1,
          borderTopColor: Colors[theme].tabIconDefault,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="services/index"
        options={{
          title: "Mis Servicios",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="services/add"
        options={{
          title: "Agregar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Ganancias",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}