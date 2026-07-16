import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { getSessionRepository } from '@/data/session-store';
import { settingsStore } from '@/data/settings-store';
import { defaultSleepSettings, type SleepSettings } from '@/domain/models';

import type { AppTheme } from './palettes';
import { selectTheme, themes } from './palettes';

export const skiaGrayscaleMatrix = [
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0, 0, 0, 1, 0,
] as const;

export const desaturatedNightThemes = {
  twilight: desaturateTheme(themes.twilight),
  amethyst: desaturateTheme(themes.amethyst),
} as const satisfies Pick<Record<keyof typeof themes, AppTheme>, 'twilight' | 'amethyst'>;

type SleepAppearanceContextValue = {
  asleep: boolean;
  settings: SleepSettings;
  theme: AppTheme;
  updateSettings: (patch: Partial<SleepSettings>) => Promise<SleepSettings>;
};

const SleepAppearanceContext = createContext<SleepAppearanceContextValue>({
  asleep: false,
  settings: defaultSleepSettings,
  theme: themes.twilight,
  updateSettings: async () => defaultSleepSettings,
});

export function desaturateTheme(theme: AppTheme): AppTheme {
  return {
    ...theme,
    backgroundGradient: [
      desaturateHexColor(theme.backgroundGradient[0]),
      desaturateHexColor(theme.backgroundGradient[1]),
    ],
    cardBackground: {
      ...theme.cardBackground,
      hex: desaturateHexColor(theme.cardBackground.hex),
    },
    textPrimary: desaturateHexColor(theme.textPrimary),
    textSecondary: desaturateHexColor(theme.textSecondary),
    accent: desaturateHexColor(theme.accent),
    success: desaturateHexColor(theme.success),
    warning: desaturateHexColor(theme.warning),
    actionPrimary: desaturateHexColor(theme.actionPrimary),
    actionSecondary: {
      ...theme.actionSecondary,
      hex: desaturateHexColor(theme.actionSecondary.hex),
    },
  };
}

export function desaturateHexColor(hex: string) {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    throw new Error(`expected 6-digit hex color, received ${hex}`);
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const gray = Math.round(red * 0.2126 + green * 0.7152 + blue * 0.0722);
  const channel = gray.toString(16).padStart(2, '0');

  return `#${channel}${channel}${channel}`;
}

export function SleepAppearanceProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const [asleep, setAsleep] = useState(false);
  const [settings, setSettings] = useState(defaultSleepSettings);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      const storedSettings = await settingsStore.getSettings();

      if (!cancelled) {
        setSettings(storedSettings);
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshActiveState() {
      const repository = await getSessionRepository();
      const activeSession = await repository.getActiveSession();

      if (!cancelled) {
        setAsleep(Boolean(activeSession));
      }
    }

    void refreshActiveState();
    const interval = setInterval(() => void refreshActiveState(), 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const theme = useMemo(
    () =>
      selectTheme({
        systemColorScheme: colorScheme === 'light' ? 'light' : 'dark',
        themeMode: settings.themeMode,
        themePalette: settings.themePalette,
      }),
    [colorScheme, settings.themeMode, settings.themePalette],
  );

  const updateSettings = useMemo(
    () => async (patch: Partial<SleepSettings>) => {
      const nextSettings = await settingsStore.updateSettings(patch);
      setSettings(nextSettings);
      return nextSettings;
    },
    [],
  );

  const value = useMemo(() => ({ asleep, settings, theme, updateSettings }), [asleep, settings, theme, updateSettings]);

  return <SleepAppearanceContext.Provider value={value}>{children}</SleepAppearanceContext.Provider>;
}

export function useIsAsleep() {
  return useContext(SleepAppearanceContext).asleep;
}

export function useSleepSettings() {
  return useContext(SleepAppearanceContext).settings;
}

export function useUpdateSleepSettings() {
  return useContext(SleepAppearanceContext).updateSettings;
}

export function useCurrentTheme() {
  return useContext(SleepAppearanceContext).theme;
}

export function useSleepAppearanceTheme(theme?: AppTheme) {
  const currentTheme = useCurrentTheme();
  const asleep = useIsAsleep();
  const visibleTheme = theme ?? currentTheme;

  return useMemo(() => (asleep ? desaturateTheme(visibleTheme) : visibleTheme), [asleep, visibleTheme]);
}
