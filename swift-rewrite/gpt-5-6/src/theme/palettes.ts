// ports: twilight/utils/thememanager.swift

import type { ColorSchemeName } from 'react-native';

import type { ThemeMode, ThemePalette } from '@/domain/models';

export type AppThemeId = ThemePalette | 'sunset';

export interface AppTheme {
  id: AppThemeId;
  colorScheme: 'light' | 'dark';
  backgroundGradient: readonly [string, string];
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  success: string;
  warning: string;
  actionPrimary: string;
  actionSecondary: string;
}

export const TWILIGHT_THEME: Readonly<AppTheme> = Object.freeze({
  id: 'twilight',
  colorScheme: 'dark',
  backgroundGradient: ['#0a1520', '#0f2a3d'] as const,
  cardBackground: 'rgba(26, 26, 46, 0.85)',
  textPrimary: '#ffffff',
  textSecondary: '#8b9dc3',
  accent: '#00d4ff',
  success: '#00ff88',
  warning: '#ff6b35',
  actionPrimary: '#00b4d8',
  actionSecondary: '#2a2a4a',
});

export const AMETHYST_THEME: Readonly<AppTheme> = Object.freeze({
  id: 'amethyst',
  colorScheme: 'dark',
  backgroundGradient: ['#0c1445', '#2c1e5e'] as const,
  cardBackground: 'rgba(28, 37, 89, 0.8)',
  textPrimary: '#ffffff',
  textSecondary: '#a3b1d6',
  accent: '#4f5bd5',
  success: '#4cd964',
  warning: '#ffcc00',
  actionPrimary: '#4f5bd5',
  actionSecondary: '#3d426b',
});

export const SUNSET_THEME: Readonly<AppTheme> = Object.freeze({
  id: 'sunset',
  colorScheme: 'light',
  backgroundGradient: ['#ff9966', '#ff5e62'] as const,
  cardBackground: 'rgba(255, 255, 255, 0.85)',
  textPrimary: '#2d1b2e',
  textSecondary: '#5c4b5e',
  accent: '#2d1b2e',
  success: '#34c759',
  warning: '#ff9500',
  actionPrimary: '#2b1c40',
  actionSecondary: 'rgba(255, 255, 255, 0.5)',
});

export function resolveTheme(
  mode: ThemeMode,
  palette: ThemePalette,
  systemColorScheme: ColorSchemeName | null,
): Readonly<AppTheme> {
  const usesLightTheme = mode === 'light' || (mode === 'system' && systemColorScheme === 'light');
  if (usesLightTheme) {
    return SUNSET_THEME;
  }
  return palette === 'amethyst' ? AMETHYST_THEME : TWILIGHT_THEME;
}
