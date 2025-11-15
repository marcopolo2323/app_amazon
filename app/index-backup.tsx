import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../stores/auth";

const { width } = Dimensions.get("window"); 

export default function SplashScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [debugInfo, setDebugInfo] = useState("Iniciando...");

  useEffect(() => {
    console.log("SplashScreen mounted, isInitialized:", isInitialized);
    setDebugInfo(`Inicializado: ${isInitialized}, Usuario: ${user ? 'Sí' : 'No'}`);
    
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      console.log("Timer completed, showing onboarding");
      setDebugInfo("Mostrando pantalla...");
      
      if (user) {
        // Si hay usuario, intentar navegar
        try {
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
        } catch (error) {
          console.error("Navigation error:", error);
          setShowOnboarding(true);
        }
      } else {
        // Si no hay usuario, mostrar onboarding en la misma pantalla
        setShowOnboarding(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInitialized, user, router]);

  const handleLogin = () => {
    try {
      console.log("Navigating to login");
      router.push('/login');
    } catch (error) {
      console.error("Error navigating to login:", error);
    }
  };

  const handleRegister = () => {
    try {
      console.log("Navigating to register");
      router.push('/register');
    } catch (error) {
      console.error("Error navigating to register:", error);
    }
  };

  // Mostrar onboarding directamente en esta pantalla
  if (showOnboarding) {
    return (
      <View style={styles.onboardingContainer}>
        <Text style={styles.title}>Bienvenido a Amazon Group</Text>
        <Text style={styles.subtitle}>Tu plataforma de servicios</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleRegister}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <Text style={styles.debugText}>{debugInfo}</Text>
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
    alignItems: "center",
  },
  debugText: {
    color: "#ffffff",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  // Estilos para onboarding
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    marginTop: 50,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2563EB',
  },
});
