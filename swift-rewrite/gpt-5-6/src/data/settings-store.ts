// ports: twilight/models/sleepsettings.swift

import Storage from 'expo-sqlite/kv-store';

import type { SleepSettings } from '@/domain/models';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const DEFAULT_SLEEP_SETTINGS: Readonly<SleepSettings> = Object.freeze({
  isOnboarded: false,
  optimalSleepMinutes: 22 * 60,
  optimalWakeMinutes: 7 * 60,
  windDownReminderEnabled: true,
  themeMode: 'dark',
  themePalette: 'twilight',
  liveActivityEnabled: true,
  liveActivityId: null,
});

const storageKeyBySetting: Record<keyof SleepSettings, string> = {
  isOnboarded: 'is_onboarded',
  optimalSleepMinutes: 'optimal_sleep_minutes',
  optimalWakeMinutes: 'optimal_wake_minutes',
  windDownReminderEnabled: 'wind_down_reminder_enabled',
  themeMode: 'theme_mode',
  themePalette: 'theme_palette',
  liveActivityEnabled: 'live_activity_enabled',
  liveActivityId: 'live_activity_id',
};

function isValidSetting<K extends keyof SleepSettings>(
  key: K,
  value: unknown,
): value is SleepSettings[K] {
  switch (key) {
    case 'isOnboarded':
    case 'windDownReminderEnabled':
    case 'liveActivityEnabled':
      return typeof value === 'boolean';
    case 'optimalSleepMinutes':
    case 'optimalWakeMinutes':
      return Number.isInteger(value) && Number(value) >= 0 && Number(value) < 24 * 60;
    case 'themeMode':
      return value === 'system' || value === 'light' || value === 'dark';
    case 'themePalette':
      return value === 'twilight' || value === 'amethyst';
    case 'liveActivityId':
      return value === null || typeof value === 'string';
  }
}

export function createSettingsStore(storage: KeyValueStorage = Storage) {
  async function get<K extends keyof SleepSettings>(key: K): Promise<SleepSettings[K]> {
    const storedValue = await storage.getItem(storageKeyBySetting[key]);
    if (storedValue === null) {
      return DEFAULT_SLEEP_SETTINGS[key];
    }

    try {
      const parsed: unknown = JSON.parse(storedValue);
      return isValidSetting(key, parsed) ? parsed : DEFAULT_SLEEP_SETTINGS[key];
    } catch {
      return DEFAULT_SLEEP_SETTINGS[key];
    }
  }

  async function set<K extends keyof SleepSettings>(
    key: K,
    value: SleepSettings[K],
  ): Promise<void> {
    if (!isValidSetting(key, value)) {
      throw new Error(`Invalid setting value for ${key}`);
    }
    await storage.setItem(storageKeyBySetting[key], JSON.stringify(value));
  }

  async function getAll(): Promise<SleepSettings> {
    const [
      isOnboarded,
      optimalSleepMinutes,
      optimalWakeMinutes,
      windDownReminderEnabled,
      themeMode,
      themePalette,
      liveActivityEnabled,
      liveActivityId,
    ] = await Promise.all([
      get('isOnboarded'),
      get('optimalSleepMinutes'),
      get('optimalWakeMinutes'),
      get('windDownReminderEnabled'),
      get('themeMode'),
      get('themePalette'),
      get('liveActivityEnabled'),
      get('liveActivityId'),
    ]);

    return {
      isOnboarded,
      optimalSleepMinutes,
      optimalWakeMinutes,
      windDownReminderEnabled,
      themeMode,
      themePalette,
      liveActivityEnabled,
      liveActivityId,
    };
  }

  async function reset(key: keyof SleepSettings): Promise<void> {
    await storage.removeItem(storageKeyBySetting[key]);
  }

  return { get, set, getAll, reset };
}

export const settingsStore = createSettingsStore();
