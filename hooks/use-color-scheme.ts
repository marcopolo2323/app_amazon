import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore, ThemePreference } from '../stores/theme';

export function useColorScheme() {
  const systemScheme = useRNColorScheme();
  const preference = useThemeStore((s) => s.preference);

  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return systemScheme ?? 'light';
}

export function useThemePreference() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  return { preference, setPreference } as {
    preference: ThemePreference;
    setPreference: (p: ThemePreference) => void;
  };
}