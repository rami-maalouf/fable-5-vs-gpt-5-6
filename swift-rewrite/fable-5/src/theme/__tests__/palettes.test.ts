// asserts every token equals the spec's design-token table (ThemeManager.swift)
import { PALETTES, desaturateTheme, resolveTheme } from '../palettes';

describe('palette tokens', () => {
  test('twilight (teal) matches the spec table', () => {
    expect(PALETTES.twilight).toEqual({
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
    });
  });

  test('amethyst (purple) matches the spec table', () => {
    expect(PALETTES.amethyst).toEqual({
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
    });
  });

  test('sunset (light) matches the spec table', () => {
    expect(PALETTES.sunset).toEqual({
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
    });
  });
});

describe('desaturateTheme (grayscale-while-asleep palette swap)', () => {
  test('every slot becomes a pure gray with luminance preserved', () => {
    for (const palette of ['twilight', 'amethyst'] as const) {
      const gray = desaturateTheme(PALETTES[palette]);
      for (const [slot, value] of Object.entries(gray)) {
        if (slot === 'name') continue;
        expect(value).toMatch(/^#([0-9a-f]{2})\1\1$|^rgba\((\d+), \2, \2, [\d.]+\)$/);
      }
    }
  });

  test('accent grays match rec.709 luminance', () => {
    // twilight accent #00d4ff: 0.7152*212 + 0.0722*255 = 170 -> #aaaaaa
    expect(desaturateTheme(PALETTES.twilight).accent).toBe('#aaaaaa');
    // white and alpha channels pass through
    expect(desaturateTheme(PALETTES.twilight).textPrimary).toBe('#ffffff');
    // #1a1a2e = rgb(26,26,46) -> 0.2126*26 + 0.7152*26 + 0.0722*46 = 27
    expect(desaturateTheme(PALETTES.twilight).cardBackground).toBe('rgba(27, 27, 27, 0.85)');
  });
});

describe('resolveTheme (ThemeManager.currentTheme)', () => {
  test('dark mode uses the selected night palette regardless of system scheme', () => {
    expect(resolveTheme('dark', 'twilight', 'light').name).toBe('twilight');
    expect(resolveTheme('dark', 'amethyst', 'light').name).toBe('amethyst');
  });

  test('light mode is always sunset (sunset is a mode, not a palette)', () => {
    expect(resolveTheme('light', 'twilight', 'dark').name).toBe('sunset');
    expect(resolveTheme('light', 'amethyst', 'light').name).toBe('sunset');
  });

  test('system mode follows the os scheme', () => {
    expect(resolveTheme('system', 'twilight', 'dark').name).toBe('twilight');
    expect(resolveTheme('system', 'amethyst', 'dark').name).toBe('amethyst');
    expect(resolveTheme('system', 'twilight', 'light').name).toBe('sunset');
  });
});
