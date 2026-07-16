import type { ThemeMode, ThemePalette } from '@/domain/models';

export type ColorScheme = 'light' | 'dark';

export type AlphaColorToken = {
  hex: string;
  opacity: number;
};

export type AppTheme = {
  id: ThemePalette | 'sunset';
  backgroundGradient: readonly [string, string];
  cardBackground: AlphaColorToken;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  success: string;
  warning: string;
  actionPrimary: string;
  actionSecondary: AlphaColorToken;
};

export const themes = {
  twilight: {
    id: 'twilight',
    backgroundGradient: ['#0a1520', '#0f2a3d'],
    cardBackground: { hex: '#1a1a2e', opacity: 0.85 },
    textPrimary: '#ffffff',
    textSecondary: '#8b9dc3',
    accent: '#00d4ff',
    success: '#00ff88',
    warning: '#ff6b35',
    actionPrimary: '#00b4d8',
    actionSecondary: { hex: '#2a2a4a', opacity: 1 },
  },
  amethyst: {
    id: 'amethyst',
    backgroundGradient: ['#0c1445', '#2c1e5e'],
    cardBackground: { hex: '#1c2559', opacity: 0.8 },
    textPrimary: '#ffffff',
    textSecondary: '#a3b1d6',
    accent: '#4f5bd5',
    success: '#4cd964',
    warning: '#ffcc00',
    actionPrimary: '#4f5bd5',
    actionSecondary: { hex: '#3d426b', opacity: 1 },
  },
  sunset: {
    id: 'sunset',
    backgroundGradient: ['#ff9966', '#ff5e62'],
    cardBackground: { hex: '#ffffff', opacity: 0.85 },
    textPrimary: '#2d1b2e',
    textSecondary: '#5c4b5e',
    accent: '#2d1b2e',
    success: '#34c759',
    warning: '#ff9500',
    actionPrimary: '#2b1c40',
    actionSecondary: { hex: '#ffffff', opacity: 0.5 },
  },
} as const satisfies Record<ThemePalette | 'sunset', AppTheme>;

export function selectTheme({
  themeMode,
  themePalette,
  systemColorScheme,
}: {
  themeMode: ThemeMode;
  themePalette: ThemePalette;
  systemColorScheme: ColorScheme;
}) {
  if (themeMode === 'light') {
    return themes.sunset;
  }

  if (themeMode === 'dark') {
    return themes[themePalette];
  }

  return systemColorScheme === 'dark' ? themes[themePalette] : themes.sunset;
}
