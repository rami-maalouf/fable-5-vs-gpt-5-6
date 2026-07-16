// ports: twilight/utils/thememanager.swift

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type ColorSchemeName, useColorScheme } from 'react-native';

import { settingsStore } from '@/data/settings-store';
import type { ThemeMode, ThemePalette } from '@/domain/models';

import { type AppTheme, resolveTheme } from './palettes';

export interface ThemePersistence {
  getThemeMode(): Promise<ThemeMode>;
  getThemePalette(): Promise<ThemePalette>;
  setThemeMode(mode: ThemeMode): Promise<void>;
  setThemePalette(palette: ThemePalette): Promise<void>;
}

interface ThemeContextValue {
  theme: Readonly<AppTheme>;
  mode: ThemeMode;
  palette: ThemePalette;
  isHydrated: boolean;
  setMode(mode: ThemeMode): Promise<void>;
  setPalette(palette: ThemePalette): Promise<void>;
}

interface ThemeProviderProps extends PropsWithChildren {
  persistence?: ThemePersistence;
  systemColorScheme?: ColorSchemeName;
}

const defaultPersistence: ThemePersistence = {
  getThemeMode: () => settingsStore.get('themeMode'),
  getThemePalette: () => settingsStore.get('themePalette'),
  setThemeMode: (mode) => settingsStore.set('themeMode', mode),
  setThemePalette: (palette) => settingsStore.set('themePalette', palette),
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  persistence = defaultPersistence,
  systemColorScheme,
}: ThemeProviderProps) {
  const detectedColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [palette, setPaletteState] = useState<ThemePalette>('twilight');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([persistence.getThemeMode(), persistence.getThemePalette()]).then(
      ([persistedMode, persistedPalette]) => {
        if (isMounted) {
          setModeState(persistedMode);
          setPaletteState(persistedPalette);
          setIsHydrated(true);
        }
      },
    );

    return () => {
      isMounted = false;
    };
  }, [persistence]);

  const setMode = useCallback(
    async (nextMode: ThemeMode) => {
      setModeState(nextMode);
      await persistence.setThemeMode(nextMode);
    },
    [persistence],
  );

  const setPalette = useCallback(
    async (nextPalette: ThemePalette) => {
      setPaletteState(nextPalette);
      await persistence.setThemePalette(nextPalette);
    },
    [persistence],
  );

  const theme = resolveTheme(mode, palette, systemColorScheme ?? detectedColorScheme);
  const value = useMemo(
    () => ({ isHydrated, mode, palette, setMode, setPalette, theme }),
    [isHydrated, mode, palette, setMode, setPalette, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
