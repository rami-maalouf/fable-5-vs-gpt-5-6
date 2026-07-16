import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { getSessionRepository } from '@/data/session-store';

import type { AppTheme } from './palettes';
import { themes } from './palettes';

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
};

const SleepAppearanceContext = createContext<SleepAppearanceContextValue>({ asleep: false });

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
  const [asleep, setAsleep] = useState(false);

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

  const value = useMemo(() => ({ asleep }), [asleep]);

  return <SleepAppearanceContext.Provider value={value}>{children}</SleepAppearanceContext.Provider>;
}

export function useIsAsleep() {
  return useContext(SleepAppearanceContext).asleep;
}

export function useSleepAppearanceTheme(theme: AppTheme) {
  const asleep = useIsAsleep();

  return useMemo(() => (asleep ? desaturateTheme(theme) : theme), [asleep, theme]);
}
