import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { ExternalLink } from '../components/external-link';
import Card from '../components/Card';
import { useAuthStore } from '../stores/auth';
import { Api } from '../lib/api';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: 'client' | 'affiliate';
  dni?: string;
  whatsapp?: string;
}

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  dni?: string;
  whatsapp?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading, login } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'client',
    dni: '',
    whatsapp: '',
  });

  const [errors, setErrors] = useState<Errors>({});

  const termsUrl = process.env.EXPO_PUBLIC_TERMS_URL as string | undefined;
  const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_URL as string | undefined;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value } as FormData;

      // Si cambia el teléfono y el rol es afiliado, copiar al WhatsApp
      if (field === 'phone' && prev.role === 'affiliate') {
        const wasSame = (prev.whatsapp || '').trim() === (prev.phone || '').trim();
        if (!prev.whatsapp || wasSame) {
          next.whatsapp = value;
        }
      }

      // Si cambia el rol a afiliado y no hay WhatsApp, copiar el teléfono
      if (field === 'role' && value === 'affiliate') {
        if (!prev.whatsapp && prev.phone) {
          next.whatsapp = prev.phone;
        }
      }

      return next;
    });
    // Clear error cuando el usuario escribe
    if (errors[field as keyof Errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(formData.email)) {
      newErrors.email = 'Formato de correo inválido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (/^\+?\d/.test(formData.phone) === false || !/^[\d\s\-\+\(\)]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    if (formData.role === 'affiliate') {
      const dni = (formData.dni || '').trim();
      if (!dni) newErrors.dni = 'El DNI es requerido';
      else if (dni.length < 6) newErrors.dni = 'El DNI debe tener al menos 6 caracteres';

      const whatsapp = (formData.whatsapp || '').trim();
      if (!whatsapp) newErrors.whatsapp = 'El WhatsApp es requerido';
      else if (!/^[\d\s\-\+\(\)]{8,}$/.test(whatsapp)) newErrors.whatsapp = 'Formato de WhatsApp inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
      };

      await register(payload);

      if (formData.role === 'affiliate') {
        // Auto login para crear perfil de afiliado
        const loginData = await login(formData.email.trim(), formData.password);
        const token = loginData.token;
        const user = loginData.user;

        // Crear perfil de afiliado con DNI y WhatsApp (yapePhone en backend)
        await Api.createAffiliate(token, {
          affiliateId: user.id || user._id,
          dni: (formData.dni || '').trim(),
          yapePhone: (formData.whatsapp || '').trim(),
          status: 'pending',
          termsAccepted: true,
        });

        // Ir al dashboard del afiliado
-        router.replace('/affiliate/dashboard');
+        router.replace('/affiliate');
        return;
      }

      // Clientes: ir a login
      router.replace('/login');
    } catch (error) {
      // Error se maneja en el store y por Toast
      console.error('Register error:', error);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <Screen
      title="Crear cuenta"
      subtitle="Únete a nuestra comunidad"
      maxWidth={400}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Role Selection */}
            <View style={styles.roleSection}>
              <Text style={styles.roleSectionTitle}>¿Qué tipo de cuenta deseas?</Text>
              <View style={styles.roleOptions}>
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    formData.role === 'client' && styles.roleCardActive,
                  ]}
                  onPress={() => updateField('role', 'client')}
                >
                  <View style={styles.roleCardContent}>
                    <Ionicons
                      name="person-outline"
                      size={32}
                      color={formData.role === 'client' ? '#2563EB' : '#6B7280'}
                    />
                    <Text style={[
                      styles.roleCardTitle,
                      formData.role === 'client' && styles.roleCardTitleActive,
                    ]}>
                      Cliente
                    </Text>
                    <Text style={styles.roleCardDescription}>
                      Busca y contrata servicios
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    formData.role === 'affiliate' && styles.roleCardActive,
                  ]}
                  onPress={() => updateField('role', 'affiliate')}
                >
                  <View style={styles.roleCardContent}>
                    <Ionicons
                      name="briefcase-outline"
                      size={32}
                      color={formData.role === 'affiliate' ? '#2563EB' : '#6B7280'}
                    />
                    <Text style={[
                      styles.roleCardTitle,
                      formData.role === 'affiliate' && styles.roleCardTitleActive,
                    ]}>
                      Afiliado
                    </Text>
                    <Text style={styles.roleCardDescription}>
                      Ofrece tus servicios
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Información personal */}
            <Input
              label="Nombre completo"
              placeholder="Tu nombre"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              error={errors.name}
              leftIcon="person-outline"
              autoCapitalize="words"
              required
            />

            <Input
              label="Correo electrónico"
              placeholder="tu@email.com"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              error={errors.email}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              required
            />

            <Input
              label="Teléfono"
              placeholder="+51 987 654 321"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              error={errors.phone}
              leftIcon="call-outline"
              keyboardType="phone-pad"
              required
            />

            {formData.role === 'affiliate' && (
              <>
                <Input
                  label="DNI"
                  placeholder="Tu DNI"
                  value={formData.dni || ''}
                  onChangeText={(text) => updateField('dni', text)}
                  error={errors.dni}
                  leftIcon="id-card-outline"
                  keyboardType="number-pad"
                  required
                />

                <Input
                  label="WhatsApp"
                  placeholder="+51 999 888 777"
                  value={formData.whatsapp || ''}
                  onChangeText={(text) => updateField('whatsapp', text)}
                  error={errors.whatsapp}
                  leftIcon="logo-whatsapp"
                  keyboardType="phone-pad"
                  required
                />
              </>
            )}

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              error={errors.password}
              leftIcon="lock-closed-outline"
              secureTextEntry
              showPasswordToggle
              required
            />

            <Input
              label="Confirmar contraseña"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              error={errors.confirmPassword}
              leftIcon="lock-closed-outline"
              secureTextEntry
              showPasswordToggle
              required
            />

            <Button
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            >
              Crear cuenta
            </Button>

            {(termsUrl || privacyUrl) && (
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ color: '#9CA3AF' }}>Al crear una cuenta aceptas nuestros </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {termsUrl && (
                    <ExternalLink href={termsUrl} style={{ color: '#2563EB', fontWeight: '600' }}>
                      Términos y condiciones
                    </ExternalLink>
                  )}
                  {termsUrl && privacyUrl && <Text style={{ color: '#9CA3AF' }}> y </Text>}
                  {privacyUrl && (
                    <ExternalLink href={privacyUrl} style={{ color: '#2563EB', fontWeight: '600' }}>
                      Política de privacidad
                    </ExternalLink>
                  )}
                </View>
              </View>
            )}

            <View style={styles.loginSection}>
              <Text style={styles.loginText}>
                ¿Ya tienes cuenta?{' '}
              </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.loginLink}>
                  Iniciar sesión
                </Text>
              </TouchableOpacity>
            </View>
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
  form: {
    flex: 1,
  },
  roleSection: {
    marginBottom: 32,
  },
  roleSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  roleCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roleCardContent: {
    alignItems: 'center',
  },
  roleCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  roleCardTitleActive: {
    color: '#2563EB',
  },
  roleCardDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
});
