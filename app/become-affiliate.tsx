import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuthStore } from '../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface DocumentFile {
  uri: string;
  name: string;
  type: string;
}

export default function BecomeAffiliateScreen() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Datos personales
  const [dni, setDni] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [yapePhone, setYapePhone] = useState('');

  // Documentos
  const [dniPhoto, setDniPhoto] = useState<DocumentFile | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<DocumentFile[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handlePickDniPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos');
      return;
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setDniPhoto({
        uri: result.assets[0].uri,
        name: `dni_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    }
  };

  const handlePickAdditionalDoc = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const doc = result.assets[0];
        setAdditionalDocs([
          ...additionalDocs,
          {
            uri: doc.uri,
            name: doc.name,
            type: doc.mimeType || 'application/pdf',
          },
        ]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  const removeAdditionalDoc = (index: number) => {
    setAdditionalDocs(additionalDocs.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!dni || dni.length !== 8) {
      Alert.alert('Error', 'Ingresa un DNI válido de 8 dígitos');
      return false;
    }
    if (!dniPhoto) {
      Alert.alert('Error', 'Debes subir una foto de tu DNI');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!bankName && !yapePhone) {
      Alert.alert(
        'Error',
        'Debes proporcionar al menos un método de pago (cuenta bancaria o Yape)'
      );
      return false;
    }
    if (bankName && !accountNumber) {
      Alert.alert('Error', 'Ingresa el número de cuenta bancaria');
      return false;
    }
    if (yapePhone && yapePhone.length !== 9) {
      Alert.alert('Error', 'Ingresa un número de Yape válido de 9 dígitos');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);
    try {
      // Crear FormData para subir archivos
      const formData = new FormData();
      formData.append('affiliateId', user?.id || '');
      formData.append('dni', dni);
      formData.append('termsAccepted', 'true');

      // Información de pago
      if (bankName && accountNumber) {
        formData.append('bankAccount[bank]', bankName);
        formData.append('bankAccount[number]', accountNumber);
      }
      if (yapePhone) {
        formData.append('yapePhone', yapePhone);
      }

      // Foto del DNI
      if (dniPhoto) {
        formData.append('dniDocument', {
          uri: dniPhoto.uri,
          name: dniPhoto.name,
          type: dniPhoto.type,
        } as any);
      }

      // Documentos adicionales
      additionalDocs.forEach((doc, index) => {
        formData.append('additionalDocuments', {
          uri: doc.uri,
          name: doc.name,
          type: doc.type,
        } as any);
      });

      const response = await fetch(`${API_URL}/api/affiliates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar solicitud');
      }

      Alert.alert(
        '¡Solicitud Enviada!',
        'Tu solicitud para ser afiliado ha sido enviada. Te notificaremos cuando sea revisada por nuestro equipo.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting affiliate request:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Información Personal</Text>
      <Text style={styles.stepDescription}>
        Necesitamos verificar tu identidad
      </Text>

      <Input
        label="Número de DNI"
        placeholder="12345678"
        value={dni}
        onChangeText={setDni}
        keyboardType="numeric"
        maxLength={8}
        leftIcon="card-outline"
        required
      />

      <View style={styles.documentSection}>
        <Text style={styles.documentLabel}>
          Foto de tu DNI (ambos lados) *
        </Text>
        <Text style={styles.documentHelper}>
          Sube una foto clara de tu DNI por ambos lados
        </Text>

        {dniPhoto ? (
          <View style={styles.documentPreview}>
            <Image source={{ uri: dniPhoto.uri }} style={styles.documentImage} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setDniPhoto(null)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickDniPhoto}
          >
            <Ionicons name="camera-outline" size={32} color="#2563EB" />
            <Text style={styles.uploadButtonText}>Subir foto del DNI</Text>
          </TouchableOpacity>
        )}
      </View>

      <Button onPress={handleNext}>Siguiente</Button>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Información de Pago</Text>
      <Text style={styles.stepDescription}>
        ¿Cómo quieres recibir tus pagos?
      </Text>

      <Card style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#2563EB" />
        <Text style={styles.infoText}>
          Proporciona al menos un método de pago. Puedes agregar ambos si lo
          prefieres.
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Cuenta Bancaria (Opcional)</Text>
      <Input
        label="Banco"
        placeholder="Ej: BCP, Interbank, BBVA"
        value={bankName}
        onChangeText={setBankName}
        leftIcon="business-outline"
      />

      <Input
        label="Número de Cuenta"
        placeholder="1234567890"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="numeric"
        leftIcon="card-outline"
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>O</Text>
        <View style={styles.dividerLine} />
      </View>

      <Text style={styles.sectionTitle}>Yape (Opcional)</Text>
      <Input
        label="Número de Yape"
        placeholder="987654321"
        value={yapePhone}
        onChangeText={setYapePhone}
        keyboardType="phone-pad"
        maxLength={9}
        leftIcon="phone-portrait-outline"
      />

      <View style={styles.buttonRow}>
        <Button
          onPress={() => setStep(1)}
          variant="outline"
          style={styles.halfButton}
        >
          Atrás
        </Button>
        <Button onPress={handleNext} style={styles.halfButton}>
          Siguiente
        </Button>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Documentos Adicionales</Text>
      <Text style={styles.stepDescription}>
        Sube documentos que respalden tu experiencia (opcional)
      </Text>

      <Card style={styles.infoCard}>
        <Ionicons name="document-text-outline" size={24} color="#10B981" />
        <Text style={styles.infoText}>
          Puedes subir certificados, licencias, fotos de trabajos anteriores,
          etc. Esto ayudará a que tu solicitud sea aprobada más rápido.
        </Text>
      </Card>

      <View style={styles.documentsContainer}>
        {additionalDocs.map((doc, index) => (
          <View key={index} style={styles.documentItem}>
            <Ionicons name="document-outline" size={24} color="#6B7280" />
            <Text style={styles.documentName} numberOfLines={1}>
              {doc.name}
            </Text>
            <TouchableOpacity onPress={() => removeAdditionalDoc(index)}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handlePickAdditionalDoc}
      >
        <Ionicons name="add-circle-outline" size={32} color="#10B981" />
        <Text style={styles.uploadButtonText}>Agregar documento</Text>
      </TouchableOpacity>

      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <Ionicons
            name={termsAccepted ? 'checkbox' : 'square-outline'}
            size={24}
            color={termsAccepted ? '#2563EB' : '#9CA3AF'}
          />
        </TouchableOpacity>
        <Text style={styles.termsText}>
          Acepto los{' '}
          <Text style={styles.termsLink}>términos y condiciones</Text> para ser
          afiliado
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <Button
          onPress={() => setStep(2)}
          variant="outline"
          style={styles.halfButton}
        >
          Atrás
        </Button>
        <Button
          onPress={handleSubmit}
          loading={loading}
          style={styles.halfButton}
        >
          Enviar Solicitud
        </Button>
      </View>
    </View>
  );

  return (
    <Screen title="Ser Afiliado" safeArea>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Conviértete en Afiliado</Text>
          <Text style={styles.subtitle}>
            Ofrece tus servicios y gana dinero
          </Text>
        </View>

        <View style={styles.stepsIndicator}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepIndicatorContainer}>
              <View
                style={[
                  styles.stepIndicator,
                  step >= s && styles.stepIndicatorActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepIndicatorText,
                    step >= s && styles.stepIndicatorTextActive,
                  ]}
                >
                  {s}
                </Text>
              </View>
              {s < 3 && (
                <View
                  style={[
                    styles.stepLine,
                    step > s && styles.stepLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        <Card style={styles.formCard}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  stepIndicatorActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  stepIndicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  stepIndicatorTextActive: {
    color: '#ffffff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  stepLineActive: {
    backgroundColor: '#2563EB',
  },
  formCard: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  documentSection: {
    marginBottom: 24,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  documentHelper: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  documentPreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#EFF6FF',
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  documentsContainer: {
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 24,
  },
  checkbox: {
    marginRight: 12,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  termsLink: {
    color: '#2563EB',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
});
