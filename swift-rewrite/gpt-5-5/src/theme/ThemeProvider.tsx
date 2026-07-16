import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemeMode, ThemePalette } from '@/domain/models';

import { createThemeController, type ThemeSettingsStore, type ThemeState } from './theme-controller';

type ThemeContextValue = ThemeState & {
  setThemeMode(themeMode: ThemeMode): Promise<ThemeState>;
  setThemePalette(themePalette: ThemePalette): Promise<ThemeState>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = PropsWithChildren<{
  settingsStore?: ThemeSettingsStore;
}>;

export function ThemeProvider({ children, settingsStore }: ThemeProviderProps) {
  const nativeColorScheme = useColorScheme();
  const systemColorScheme = nativeColorScheme === 'dark' ? 'dark' : 'light';
  const controller = useMemo(() => createThemeController({ settingsStore, systemColorScheme }), [settingsStore, systemColorScheme]);
  const [state, setState] = useState(controller.getState());

  useEffect(() => controller.subscribe(setState), [controller]);

  useEffect(() => {
    controller.setSystemColorScheme(systemColorScheme);
  }, [controller, systemColorScheme]);

  useEffect(() => {
    void controller.load();
  }, [controller]);

  const value = useMemo(
    () => ({
      ...state,
      setThemeMode: controller.setThemeMode,
      setThemePalette: controller.setThemePalette,
    }),
    [controller, state],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return theme;
}
