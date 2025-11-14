import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ExternalLink } from '../components/external-link';
import { useThemePreference } from '../hooks/use-color-scheme';
import { useThemeColor } from '../hooks/use-theme-color';
import { router } from 'expo-router';

const options = [
  { key: 'system', label: 'Usar tema del sistema' },
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
] as const;

export default function SettingsScreen() {
  const { preference, setPreference } = useThemePreference();
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColorDefault = useThemeColor({}, 'icon');
  const termsUrl = process.env.EXPO_PUBLIC_TERMS_URL as string | undefined;
  const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_URL as string | undefined;

  const handleSelect = (key: 'system' | 'light' | 'dark') => {
    setPreference(key);
  };

  return (
    <View style={{ flex: 1, backgroundColor: background, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}>
          <Text style={{ color: tintColor }}>Volver</Text>
        </TouchableOpacity>
        <Text style={{ color: textColor, fontSize: 18, fontWeight: '600' }}>Configuración</Text>
      </View>

      <Text style={{ color: textColor, fontSize: 16, marginBottom: 12 }}>Tema</Text>

      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          onPress={() => handleSelect(opt.key)}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 12,
            borderRadius: 10,
            marginBottom: 10,
            backgroundColor: background,
            borderWidth: preference === opt.key ? 2 : 1,
            borderColor: preference === opt.key ? tintColor : borderColorDefault,
          }}
        >
          <Text style={{ color: textColor, fontSize: 16 }}>{opt.label}</Text>
          {preference === opt.key && (
            <Text style={{ color: tintColor, marginTop: 6 }}>Seleccionado</Text>
          )}
        </TouchableOpacity>
      ))}

      {(termsUrl || privacyUrl) && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: textColor, fontSize: 16, marginBottom: 12 }}>Información legal</Text>
          {termsUrl && (
            <ExternalLink href={termsUrl} style={{ color: tintColor, marginBottom: 8 }}>
              Términos y condiciones
            </ExternalLink>
          )}
          {privacyUrl && (
            <ExternalLink href={privacyUrl} style={{ color: tintColor }}>
              Política de privacidad
            </ExternalLink>
          )}
        </View>
      )}
    </View>
  );
}