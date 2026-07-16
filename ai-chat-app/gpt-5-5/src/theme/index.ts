import { DynamicColorIOS, Platform, useColorScheme } from 'react-native';

export { CHAT_MODELS as MODEL_OPTIONS, DEFAULT_CHAT_MODEL } from '@/domain/model';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const novaColorSchemes = {
  light: {
    background: '#ffffff',
    elevated: '#ffffff',
    text: '#111111',
    secondaryText: '#6e6e73',
    tertiaryText: '#8e8e93',
    separator: '#d1d1d6',
    secondaryFill: '#f2f2f7',
    disabledFill: '#e5e5ea',
    accent: '#006edb',
    accentText: '#ffffff',
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
    accentText: '#000000',
  },
} as const;

const iosColors = {
  background: DynamicColorIOS({
    light: novaColorSchemes.light.background,
    dark: novaColorSchemes.dark.background,
  }),
  elevated: DynamicColorIOS({
    light: novaColorSchemes.light.elevated,
    dark: novaColorSchemes.dark.elevated,
  }),
  text: DynamicColorIOS({
    light: novaColorSchemes.light.text,
    dark: novaColorSchemes.dark.text,
  }),
  secondaryText: DynamicColorIOS({
    light: novaColorSchemes.light.secondaryText,
    dark: novaColorSchemes.dark.secondaryText,
  }),
  tertiaryText: DynamicColorIOS({
    light: novaColorSchemes.light.tertiaryText,
    dark: novaColorSchemes.dark.tertiaryText,
  }),
  separator: DynamicColorIOS({
    light: novaColorSchemes.light.separator,
    dark: novaColorSchemes.dark.separator,
  }),
  secondaryFill: DynamicColorIOS({
    light: novaColorSchemes.light.secondaryFill,
    dark: novaColorSchemes.dark.secondaryFill,
  }),
  disabledFill: DynamicColorIOS({
    light: novaColorSchemes.light.disabledFill,
    dark: novaColorSchemes.dark.disabledFill,
  }),
  accent: DynamicColorIOS({
    light: novaColorSchemes.light.accent,
    dark: novaColorSchemes.dark.accent,
  }),
  accentText: DynamicColorIOS({
    light: novaColorSchemes.light.accentText,
    dark: novaColorSchemes.dark.accentText,
  }),
} as const;

export function useNovaTheme() {
  const scheme = useColorScheme();
  const fallback = novaColorSchemes[scheme === 'dark' ? 'dark' : 'light'];

  return {
    colors: Platform.OS === 'ios' ? iosColors : fallback,
    scheme: scheme === 'dark' ? 'dark' : 'light',
  };
}
