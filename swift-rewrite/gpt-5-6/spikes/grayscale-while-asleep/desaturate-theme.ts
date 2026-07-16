import type { AppTheme } from '@/theme/palettes';

interface ParsedColor {
  red: number;
  green: number;
  blue: number;
  alpha?: string;
  format: 'hex' | 'rgb';
}

export function desaturateColor(color: string): string {
  const parsed = parseColor(color);
  const luminance = Math.round(
    parsed.red * 0.2126 + parsed.green * 0.7152 + parsed.blue * 0.0722,
  );

  if (parsed.format === 'hex') {
    const channel = luminance.toString(16).padStart(2, '0');
    return `#${channel}${channel}${channel}`;
  }

  const prefix = parsed.alpha === undefined ? 'rgb' : 'rgba';
  const alpha = parsed.alpha === undefined ? '' : `, ${parsed.alpha}`;
  return `${prefix}(${luminance}, ${luminance}, ${luminance}${alpha})`;
}

export function desaturateTheme(theme: Readonly<AppTheme>): Readonly<AppTheme> {
  return Object.freeze({
    ...theme,
    accent: desaturateColor(theme.accent),
    actionPrimary: desaturateColor(theme.actionPrimary),
    actionSecondary: desaturateColor(theme.actionSecondary),
    backgroundGradient: theme.backgroundGradient.map(desaturateColor) as [string, string],
    cardBackground: desaturateColor(theme.cardBackground),
    success: desaturateColor(theme.success),
    textPrimary: desaturateColor(theme.textPrimary),
    textSecondary: desaturateColor(theme.textSecondary),
    warning: desaturateColor(theme.warning),
  });
}

function parseColor(color: string): ParsedColor {
  const hex = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex) {
    return {
      blue: Number.parseInt(hex[3], 16),
      format: 'hex',
      green: Number.parseInt(hex[2], 16),
      red: Number.parseInt(hex[1], 16),
    };
  }

  const rgb = color.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
  if (rgb) {
    return {
      alpha: rgb[4],
      blue: Number(rgb[3]),
      format: 'rgb',
      green: Number(rgb[2]),
      red: Number(rgb[1]),
    };
  }

  throw new Error(`Unsupported theme color: ${color}`);
}
