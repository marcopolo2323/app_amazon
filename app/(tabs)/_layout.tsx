import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/auth";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { Colors } from "../../constants/theme";

export default function TabLayout() {
  const user = useAuthStore((state) => state.user);
  const theme = useColorScheme() ?? "light";

  // Security: Only show tabs for authenticated users with client or affiliate role
  if (!user || (user.role !== "client" && user.role !== "affiliate")) {
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
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
