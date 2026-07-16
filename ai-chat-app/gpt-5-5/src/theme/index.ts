import { DynamicColorIOS, Platform, useColorScheme } from 'react-native';

export { CHAT_MODELS as MODEL_OPTIONS, DEFAULT_CHAT_MODEL } from '@/domain/model';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

const iosColors = {
  background: DynamicColorIOS({ light: '#ffffff', dark: '#000000' }),
  elevated: DynamicColorIOS({ light: '#ffffff', dark: '#1c1c1e' }),
  text: DynamicColorIOS({ light: '#111111', dark: '#f5f5f7' }),
  secondaryText: DynamicColorIOS({ light: '#6e6e73', dark: '#a1a1aa' }),
  tertiaryText: DynamicColorIOS({ light: '#8e8e93', dark: '#7c7c80' }),
  separator: DynamicColorIOS({ light: '#d1d1d6', dark: '#38383a' }),
  secondaryFill: DynamicColorIOS({ light: '#f2f2f7', dark: '#2c2c2e' }),
  disabledFill: DynamicColorIOS({ light: '#e5e5ea', dark: '#3a3a3c' }),
  accent: DynamicColorIOS({ light: '#0a84ff', dark: '#64d2ff' }),
} as const;

const fallbackColors = {
  light: {
    background: '#ffffff',
    elevated: '#ffffff',
    text: '#111111',
    secondaryText: '#6e6e73',
    tertiaryText: '#8e8e93',
    separator: '#d1d1d6',
    secondaryFill: '#f2f2f7',
    disabledFill: '#e5e5ea',
    accent: '#0a84ff',
  },
  dark: {
    background: '#000000',
    elevated: '#1c1c1e',
    text: '#f5f5f7',
    secondaryText: '#a1a1aa',
    tertiaryText: '#7c7c80',
    separator: '#38383a',
    secondaryFill: '#2c2c2e',
    disabledFill: '#3a3a3c',
    accent: '#64d2ff',
  },
} as const;

export function useNovaTheme() {
  const scheme = useColorScheme();
  const fallback = fallbackColors[scheme === 'dark' ? 'dark' : 'light'];

  return {
    colors: Platform.OS === 'ios' ? iosColors : fallback,
    scheme: scheme === 'dark' ? 'dark' : 'light',
  };
}
