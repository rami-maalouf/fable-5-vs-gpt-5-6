import { selectTheme, themes } from './palettes';

describe('theme palettes', () => {
  it('matches every spec palette token exactly', () => {
    expect(themes.twilight).toEqual({
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
    });
    expect(themes.amethyst).toEqual({
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
    });
    expect(themes.sunset).toEqual({
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
    });
  });

  it('selects sunset from light mode and keeps palette selection for night modes', () => {
    expect(selectTheme({ themeMode: 'light', themePalette: 'amethyst', systemColorScheme: 'dark' }).id).toBe('sunset');
    expect(selectTheme({ themeMode: 'dark', themePalette: 'amethyst', systemColorScheme: 'light' }).id).toBe('amethyst');
    expect(selectTheme({ themeMode: 'system', themePalette: 'twilight', systemColorScheme: 'dark' }).id).toBe('twilight');
    expect(selectTheme({ themeMode: 'system', themePalette: 'amethyst', systemColorScheme: 'light' }).id).toBe('sunset');
  });
});
