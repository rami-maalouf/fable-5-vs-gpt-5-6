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

// grayscale-while-asleep (spike 3 decision): ios has no whole-tree saturate
// filter, so the active-session grayscale is a luminance-preserving palette
// swap applied to every theme slot (plus white/black passthroughs)
export function desaturateColor(color: string): string {
  const toGray = (r: number, g: number, b: number) =>
    Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const hexMatch = /^#([0-9a-f]{6})$/i.exec(color);
  if (hexMatch) {
    const v = parseInt(hexMatch[1], 16);
    const gray = toGray((v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff);
    const g2 = gray.toString(16).padStart(2, '0');
    return `#${g2}${g2}${g2}`;
  }
  const rgbaMatch = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(color);
  if (rgbaMatch) {
    const gray = toGray(Number(rgbaMatch[1]), Number(rgbaMatch[2]), Number(rgbaMatch[3]));
    return `rgba(${gray}, ${gray}, ${gray}, ${rgbaMatch[4]})`;
  }
  return color;
}

export function desaturateTheme(theme: AppTheme): AppTheme {
  return {
    name: theme.name,
    backgroundGradientStart: desaturateColor(theme.backgroundGradientStart),
    backgroundGradientEnd: desaturateColor(theme.backgroundGradientEnd),
    cardBackground: desaturateColor(theme.cardBackground),
    textPrimary: desaturateColor(theme.textPrimary),
    textSecondary: desaturateColor(theme.textSecondary),
    accent: desaturateColor(theme.accent),
    success: desaturateColor(theme.success),
    warning: desaturateColor(theme.warning),
    actionPrimary: desaturateColor(theme.actionPrimary),
    actionSecondary: desaturateColor(theme.actionSecondary),
  };
}

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
