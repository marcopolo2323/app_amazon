import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function SimpleOnboardingScreen() {
  const router = useRouter();

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

  console.log("SimpleOnboardingScreen rendered");

  return (
    <View style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 50,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
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