// theme context: components never hardcode palette hexes (spec code style)
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemeMode, ThemePalette } from '../domain/models';
import type { SettingsStore } from '../data/settings-store';
import { desaturateTheme, resolveTheme, type AppTheme } from './palettes';

interface ThemeControls {
  mode: ThemeMode;
  palette: ThemePalette;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: ThemePalette) => void;
}

const ThemeContext = createContext<AppTheme | null>(null);
const ThemeControlsContext = createContext<ThemeControls | null>(null);

export function ThemeProvider({
  store,
  desaturated = false,
  children,
}: {
  store: SettingsStore;
  // grayscale-while-asleep: the app root flips this while a session is active
  desaturated?: boolean;
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme() ?? 'dark';
  const [mode, setModeState] = useState<ThemeMode>(() => store.get('themeMode'));
  const [palette, setPaletteState] = useState<ThemePalette>(() => store.get('themePalette'));

  const setMode = useCallback(
    (next: ThemeMode) => {
      store.set('themeMode', next);
      setModeState(next);
    },
    [store]
  );

  const setPalette = useCallback(
    (next: ThemePalette) => {
      store.set('themePalette', next);
      setPaletteState(next);
    },
    [store]
  );

  const baseTheme = resolveTheme(mode, palette, systemScheme === 'dark' ? 'dark' : 'light');
  const theme = desaturated ? desaturateTheme(baseTheme) : baseTheme;
  const controls = useMemo(
    () => ({ mode, palette, setMode, setPalette }),
    [mode, palette, setMode, setPalette]
  );

  return (
    <ThemeContext value={theme}>
      <ThemeControlsContext value={controls}>{children}</ThemeControlsContext>
    </ThemeContext>
  );
}

export function useTheme(): AppTheme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}

export function useThemeControls(): ThemeControls {
  const controls = useContext(ThemeControlsContext);
  if (!controls) throw new Error('useThemeControls must be used inside ThemeProvider');
  return controls;
}
