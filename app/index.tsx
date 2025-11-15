import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../stores/auth";

const { width } = Dimensions.get("window"); 

export default function SplashScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [shouldNavigate, setShouldNavigate] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      setShouldNavigate(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isInitialized]);

  useEffect(() => {
    if (isInitialized && shouldNavigate) {
      if (user) {
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
        router.replace("/onboarding");
      }
    }
  }, [isInitialized, shouldNavigate, user, router]);

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
  logoContainer: {
    marginBottom: 0,
  },
  logoImage: {
    width: width * 0.7,
    height: width * 0.7,
  },
  footer: {
    paddingBottom: 200,
  },
});
