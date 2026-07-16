import { AMETHYST_THEME, TWILIGHT_THEME } from '../src/theme/palettes';
import {
  desaturateColor,
  desaturateTheme,
} from '../spikes/grayscale-while-asleep/desaturate-theme';

function channels(color: string): number[] {
  if (color.startsWith('#')) {
    return [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16));
  }
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) {
    throw new Error(`Unsupported test color: ${color}`);
  }
  return match.slice(1, 4).map(Number);
}

describe('grayscale palette generation', () => {
  it('uses perceptual luminance and preserves alpha', () => {
    expect(desaturateColor('#00d4ff')).toBe('#aaaaaa');
    expect(desaturateColor('#4f5bd5')).toBe('#616161');
    expect(desaturateColor('rgba(26, 26, 46, 0.85)')).toBe('rgba(27, 27, 27, 0.85)');
  });

  it.each([TWILIGHT_THEME, AMETHYST_THEME])('generates an achromatic $id theme', (theme) => {
    const grayscale = desaturateTheme(theme);
    const colors = [
      ...grayscale.backgroundGradient,
      grayscale.cardBackground,
      grayscale.textPrimary,
      grayscale.textSecondary,
      grayscale.accent,
      grayscale.success,
      grayscale.warning,
      grayscale.actionPrimary,
      grayscale.actionSecondary,
    ];

    expect(grayscale.id).toBe(theme.id);
    for (const color of colors) {
      const [red, green, blue] = channels(color);
      expect(red).toBe(green);
      expect(green).toBe(blue);
    }
  });
});
