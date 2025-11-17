import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { useAuthStore } from '../stores/auth';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: 'client' | 'affiliate';
  dni?: string;
  yapePhone?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'client',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateFormData = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    // Validaciones
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.role === 'affiliate' && (!formData.dni || !formData.yapePhone)) {
      Alert.alert('Error', 'Los afiliados deben proporcionar DNI y teléfono Yape');
      return;
    }

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
      };

      const result = await register(payload);

      if (formData.role === 'affiliate' && result?.token) {
        // Crear perfil de afiliado
        const { Api } = await import('../lib/api');
        await Api.createAffiliate(result.token, {
          affiliateId: result.user.id || result.user._id,
          dni: formData.dni || '',
          yapePhone: formData.yapePhone || '',
        });
      }

      Alert.alert(
        'Éxito',
        'Cuenta creada exitosamente. Por favor inicia sesión.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear la cuenta');
    }
  };

  return (
    <Screen safeArea scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              Únete a Amazon Group hoy
            </Text>
          </View>

          <Card style={styles.card}>
            {/* Selector de rol */}
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'client' && styles.roleButtonActive,
                ]}
                onPress={() => updateFormData('role', 'client')}
              >
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={formData.role === 'client' ? '#2563EB' : '#666'}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === 'client' && styles.roleButtonTextActive,
                  ]}
                >
                  Cliente
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'affiliate' && styles.roleButtonActive,
                ]}
                onPress={() => updateFormData('role', 'affiliate')}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={24}
                  color={formData.role === 'affiliate' ? '#2563EB' : '#666'}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === 'affiliate' && styles.roleButtonTextActive,
                  ]}
                >
                  Afiliado
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              leftIcon="person-outline"
            />

            <Input
              label="Email"
              placeholder="tu@email.com"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />

            <Input
              label="Teléfono"
              placeholder="+51 999 999 999"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            {formData.role === 'affiliate' && (
              <>
                <Input
                  label="DNI"
                  placeholder="12345678"
                  value={formData.dni}
                  onChangeText={(value) => updateFormData('dni', value)}
                  keyboardType="numeric"
                  leftIcon="card-outline"
                />

                <Input
                  label="Teléfono Yape"
                  placeholder="+51 999 999 999"
                  value={formData.yapePhone}
                  onChangeText={(value) => updateFormData('yapePhone', value)}
                  keyboardType="phone-pad"
                  leftIcon="wallet-outline"
                />
              </>
            )}

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
              showPasswordToggle
              leftIcon="lock-closed-outline"
            />

            <Input
              label="Confirmar contraseña"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry
              showPasswordToggle
              leftIcon="lock-closed-outline"
            />

            <Button
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            >
              Crear Cuenta
            </Button>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>Inicia sesión</Text>
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
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    padding: 20,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#2563EB',
  },
  registerButton: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
