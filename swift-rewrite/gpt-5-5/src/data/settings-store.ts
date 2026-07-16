import Storage from 'expo-sqlite/kv-store';

import { defaultSleepSettings, type SleepSettings, type ThemeMode, type ThemePalette } from '@/domain/models';

export type SettingsStorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
};

const keys = {
  isOnboarded: 'is_onboarded',
  liveActivityEnabled: 'live_activity_enabled',
  liveActivityId: 'live_activity_id',
  optimalSleepMinutes: 'optimal_sleep_minutes',
  optimalWakeMinutes: 'optimal_wake_minutes',
  themeMode: 'theme_mode',
  themePalette: 'theme_palette',
  windDownEnabled: 'wind_down_reminder_enabled',
} as const;

function parseBoolean(value: string | null, fallback: boolean) {
  if (value == null) {
    return fallback;
  }

  return value === 'true';
}

function parseInteger(value: string | null, fallback: number) {
  if (value == null) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseThemeMode(value: string | null): ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark' ? value : defaultSleepSettings.themeMode;
}

function parseThemePalette(value: string | null): ThemePalette {
  return value === 'twilight' || value === 'amethyst' ? value : defaultSleepSettings.themePalette;
}

export function createSettingsStore(storage: SettingsStorageLike = Storage) {
  return {
    async getSettings(): Promise<SleepSettings> {
      const [
        isOnboarded,
        optimalSleepMinutes,
        optimalWakeMinutes,
        windDownEnabled,
        themeMode,
        themePalette,
        liveActivityEnabled,
        liveActivityId,
      ] = await Promise.all([
        storage.getItem(keys.isOnboarded),
        storage.getItem(keys.optimalSleepMinutes),
        storage.getItem(keys.optimalWakeMinutes),
        storage.getItem(keys.windDownEnabled),
        storage.getItem(keys.themeMode),
        storage.getItem(keys.themePalette),
        storage.getItem(keys.liveActivityEnabled),
        storage.getItem(keys.liveActivityId),
      ]);

      return {
        isOnboarded: parseBoolean(isOnboarded, defaultSleepSettings.isOnboarded),
        optimalSleepMinutes: parseInteger(optimalSleepMinutes, defaultSleepSettings.optimalSleepMinutes),
        optimalWakeMinutes: parseInteger(optimalWakeMinutes, defaultSleepSettings.optimalWakeMinutes),
        windDownEnabled: parseBoolean(windDownEnabled, defaultSleepSettings.windDownEnabled),
        themeMode: parseThemeMode(themeMode),
        themePalette: parseThemePalette(themePalette),
        liveActivityEnabled: parseBoolean(liveActivityEnabled, defaultSleepSettings.liveActivityEnabled),
        liveActivityId: liveActivityId ?? defaultSleepSettings.liveActivityId,
      };
    },

    async saveSettings(settings: SleepSettings) {
      await Promise.all([
        storage.setItem(keys.isOnboarded, String(settings.isOnboarded)),
        storage.setItem(keys.optimalSleepMinutes, String(settings.optimalSleepMinutes)),
        storage.setItem(keys.optimalWakeMinutes, String(settings.optimalWakeMinutes)),
        storage.setItem(keys.windDownEnabled, String(settings.windDownEnabled)),
        storage.setItem(keys.themeMode, settings.themeMode),
        storage.setItem(keys.themePalette, settings.themePalette),
        storage.setItem(keys.liveActivityEnabled, String(settings.liveActivityEnabled)),
        settings.liveActivityId == null
          ? storage.removeItem?.(keys.liveActivityId)
          : storage.setItem(keys.liveActivityId, settings.liveActivityId),
      ]);
    },

    async updateSettings(patch: Partial<SleepSettings>) {
      const current = await this.getSettings();
      const next = { ...current, ...patch };
      await this.saveSettings(next);
      return next;
    },
  };
}

export const settingsStore = createSettingsStore();
