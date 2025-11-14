import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../stores/auth";

const { width, height } = Dimensions.get("window"); 

export default function SplashScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      if (user) {
        // User is authenticated, navigate based on role
        switch (user.role) {
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
      } else {
        // User not authenticated, go to onboarding
        router.replace("/onboarding");
      }
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, [user, isInitialized, router]);

  return (
    <View style={styles.container}>
  
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logo.jpg")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      

      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 0,
  },
  logoImage: {
    width: width * 0.7,
    height: width * 0.7,
  },
  subtitle: {
    fontSize: 18,
    color: "#E0E7FF",
    textAlign: "center",
    marginHorizontal: 40,
  },
  footer: {
    paddingBottom: 200,
  },
});
