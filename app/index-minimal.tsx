import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function MinimalIndex() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!showWelcome) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require("../assets/images/logo.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Amazon Group</Text>
      <Text style={styles.subtitle}>Bienvenido</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => {
          try {
            router.push('/login');
          } catch (e) {
            console.error(e);
          }
        }}
      >
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => {
          try {
            router.push('/register');
          } catch (e) {
            console.error(e);
          }
        }}
      >
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Registrarse</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#2563EB',
  },
});
