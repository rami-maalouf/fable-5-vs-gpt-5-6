// ports: Utils/ThemeManager.swift - exact token tables from the spec (normative)
import type { ThemeMode, ThemePalette } from '../domain/models';

export type ThemeName = ThemePalette | 'sunset';

export interface AppTheme {
  name: ThemeName;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  success: string;
  warning: string;
  actionPrimary: string;
  actionSecondary: string;
}

export const PALETTES: Record<ThemeName, AppTheme> = {
  twilight: {
    name: 'twilight',
    backgroundGradientStart: '#0a1520',
    backgroundGradientEnd: '#0f2a3d',
    cardBackground: 'rgba(26, 26, 46, 0.85)',
    textPrimary: '#ffffff',
    textSecondary: '#8b9dc3',
    accent: '#00d4ff',
    success: '#00ff88',
    warning: '#ff6b35',
    actionPrimary: '#00b4d8',
    actionSecondary: '#2a2a4a',
  },
  amethyst: {
    name: 'amethyst',
    backgroundGradientStart: '#0c1445',
    backgroundGradientEnd: '#2c1e5e',
    cardBackground: 'rgba(28, 37, 89, 0.8)',
    textPrimary: '#ffffff',
    textSecondary: '#a3b1d6',
    accent: '#4f5bd5',
    success: '#4cd964',
    warning: '#ffcc00',
    actionPrimary: '#4f5bd5',
    actionSecondary: '#3d426b',
  },
  sunset: {
    name: 'sunset',
    backgroundGradientStart: '#ff9966',
    backgroundGradientEnd: '#ff5e62',
    cardBackground: 'rgba(255, 255, 255, 0.85)',
    textPrimary: '#2d1b2e',
    textSecondary: '#5c4b5e',
    accent: '#2d1b2e',
    success: '#34c759',
    warning: '#ff9500',
    actionPrimary: '#2b1c40',
    actionSecondary: 'rgba(255, 255, 255, 0.5)',
  },
};

// ports ThemeManager.currentTheme(for:): sunset is the light-mode theme,
// the palette picker only chooses between the two night palettes
export function resolveTheme(
  mode: ThemeMode,
  palette: ThemePalette,
  systemScheme: 'light' | 'dark'
): AppTheme {
  if (mode === 'light') return PALETTES.sunset;
  if (mode === 'dark') return PALETTES[palette];
  return systemScheme === 'dark' ? PALETTES[palette] : PALETTES.sunset;
}
