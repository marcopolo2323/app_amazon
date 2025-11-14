import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { Api } from '../lib/api';
import Toast from 'react-native-toast-message';

export default function RecoverPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendReset = async () => {
    if (!email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Formato de correo inválido');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await Api.requestPasswordReset(email.trim());
      setSent(true);

      Toast.show({
        type: 'success',
        text1: 'Correo enviado',
        text2: 'Revisa tu bandeja de entrada para restablecer tu contraseña'
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Error al enviar el correo';
      setError(errorMessage);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  const handleResend = () => {
    setSent(false);
    setEmail('');
    setError('');
  };

  const renderSuccessState = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="mail-outline" size={64} color="#10B981" />
      </View>

      <Text style={styles.successTitle}>
        ¡Correo enviado!
      </Text>

      <Text style={styles.successDescription}>
        Hemos enviado las instrucciones para restablecer tu contraseña a:
      </Text>

      <Text style={styles.emailText}>{email}</Text>

      <Card style={styles.instructionsCard}>
        <View style={styles.instructionsContent}>
          <Ionicons name="information-circle-outline" size={24} color="#2563EB" />
          <View style={styles.instructionsText}>
            <Text style={styles.instructionsTitle}>
              Sigue estos pasos:
            </Text>
            <Text style={styles.instructionsStep}>
              1. Revisa tu bandeja de entrada
            </Text>
            <Text style={styles.instructionsStep}>
              2. Busca el correo de Amazon Group
            </Text>
            <Text style={styles.instructionsStep}>
              3. Haz clic en el enlace para restablecer
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.successActions}>
        <Button
          onPress={handleBackToLogin}
          style={styles.backButton}
        >
          Volver al inicio de sesión
        </Button>

        <TouchableOpacity
          onPress={handleResend}
          style={styles.resendButton}
        >
          <Text style={styles.resendText}>
            ¿No recibiste el correo? Reenviar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForm = () => (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="lock-closed-outline" size={32} color="#2563EB" />
          </View>
        </View>

        <Input
          label="Correo electrónico"
          placeholder="tu@email.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError('');
          }}
          error={error}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          required
        />

        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              Te enviaremos un enlace para restablecer tu contraseña a tu correo electrónico.
            </Text>
          </View>
        </Card>

        <Button
          onPress={handleSendReset}
          loading={loading}
          style={styles.sendButton}
        >
          Enviar instrucciones
        </Button>

        <TouchableOpacity
          onPress={handleBackToLogin}
          style={styles.backToLoginButton}
        >
          <Ionicons name="arrow-back" size={16} color="#6B7280" />
          <Text style={styles.backToLoginText}>
            Volver al inicio de sesión
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <Screen
      title="Recuperar contraseña"
      subtitle={sent ? undefined : "Ingresa tu correo para restablecer tu contraseña"}
      maxWidth={400}
    >
      {sent ? renderSuccessState() : renderForm()}
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
    padding: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  sendButton: {
    marginBottom: 24,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  successDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 32,
  },
  instructionsCard: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 32,
    padding: 16,
  },
  instructionsContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionsText: {
    marginLeft: 12,
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  instructionsStep: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 4,
  },
  successActions: {
    width: '100%',
    alignItems: 'center',
  },
  backButton: {
    width: '100%',
    marginBottom: 16,
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
});
