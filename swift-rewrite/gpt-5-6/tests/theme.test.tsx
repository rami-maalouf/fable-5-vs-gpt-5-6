jest.mock('expo-sqlite/kv-store', () => ({ __esModule: true, default: {} }));

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import type { ThemeMode, ThemePalette } from '../src/domain/models';
import {
  AMETHYST_THEME,
  SUNSET_THEME,
  TWILIGHT_THEME,
  resolveTheme,
} from '../src/theme/palettes';
import {
  ThemeProvider,
  type ThemePersistence,
  useTheme,
} from '../src/theme/ThemeProvider';

class MemoryThemePersistence implements ThemePersistence {
  mode: ThemeMode;
  palette: ThemePalette;

  constructor(mode: ThemeMode, palette: ThemePalette) {
    this.mode = mode;
    this.palette = palette;
  }

  async getThemeMode() {
    return this.mode;
  }

  async getThemePalette() {
    return this.palette;
  }

  async setThemeMode(mode: ThemeMode) {
    this.mode = mode;
  }

  async setThemePalette(palette: ThemePalette) {
    this.palette = palette;
  }
}

function ThemeProbe() {
  const { isHydrated, mode, palette, setMode, setPalette, theme } = useTheme();

  return (
    <View>
      <Text testID="theme-id">{theme.id}</Text>
      <Text testID="theme-state">{`${mode}:${palette}:${isHydrated}`}</Text>
      <Pressable testID="light-mode" onPress={() => void setMode('light')} />
      <Pressable testID="amethyst-palette" onPress={() => void setPalette('amethyst')} />
    </View>
  );
}

describe('theme palettes', () => {
  it('matches every normative color slot', () => {
    expect(TWILIGHT_THEME).toEqual({
      id: 'twilight',
      colorScheme: 'dark',
      backgroundGradient: ['#0a1520', '#0f2a3d'],
      cardBackground: 'rgba(26, 26, 46, 0.85)',
      textPrimary: '#ffffff',
      textSecondary: '#8b9dc3',
      accent: '#00d4ff',
      success: '#00ff88',
      warning: '#ff6b35',
      actionPrimary: '#00b4d8',
      actionSecondary: '#2a2a4a',
    });
    expect(AMETHYST_THEME).toEqual({
      id: 'amethyst',
      colorScheme: 'dark',
      backgroundGradient: ['#0c1445', '#2c1e5e'],
      cardBackground: 'rgba(28, 37, 89, 0.8)',
      textPrimary: '#ffffff',
      textSecondary: '#a3b1d6',
      accent: '#4f5bd5',
      success: '#4cd964',
      warning: '#ffcc00',
      actionPrimary: '#4f5bd5',
      actionSecondary: '#3d426b',
    });
    expect(SUNSET_THEME).toEqual({
      id: 'sunset',
      colorScheme: 'light',
      backgroundGradient: ['#ff9966', '#ff5e62'],
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

  it('treats sunset as light mode and follows the system scheme', () => {
    expect(resolveTheme('light', 'amethyst', 'dark')).toBe(SUNSET_THEME);
    expect(resolveTheme('dark', 'amethyst', 'light')).toBe(AMETHYST_THEME);
    expect(resolveTheme('system', 'amethyst', 'light')).toBe(SUNSET_THEME);
    expect(resolveTheme('system', 'amethyst', 'dark')).toBe(AMETHYST_THEME);
    expect(resolveTheme('system', 'twilight', null)).toBe(TWILIGHT_THEME);
  });
});

describe('theme provider', () => {
  it('hydrates persisted settings and switches mode and palette live', async () => {
    const persistence = new MemoryThemePersistence('system', 'twilight');
    await render(
      <ThemeProvider persistence={persistence} systemColorScheme="dark">
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme-state').props.children).toBe('system:twilight:true');
    });
    expect(screen.getByTestId('theme-id').props.children).toBe('twilight');

    await fireEvent.press(screen.getByTestId('amethyst-palette'));
    await waitFor(() => {
      expect(screen.getByTestId('theme-id').props.children).toBe('amethyst');
    });
    expect(persistence.palette).toBe('amethyst');

    await fireEvent.press(screen.getByTestId('light-mode'));
    await waitFor(() => {
      expect(screen.getByTestId('theme-id').props.children).toBe('sunset');
    });
    expect(persistence.mode).toBe('light');
  });
});
