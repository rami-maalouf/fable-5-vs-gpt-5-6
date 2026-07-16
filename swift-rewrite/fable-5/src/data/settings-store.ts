// ports: Models/SleepSettings.swift + @AppStorage keys
// persistence swap: UserDefaults -> expo-sqlite/kv-store (spec decision)
import { DEFAULT_SETTINGS, type SleepSettingsData } from '../domain/models';

// structural subset of expo-sqlite/kv-store's Storage; tests use an in-memory map
export interface KeyValueStorage {
  getItemSync(key: string): string | null;
  setItemSync(key: string, value: string): void;
}

const PREFIX = 'twilight.settings.';
const MAX_MINUTES = 24 * 60 - 1;

function clampMinutes(minutes: number): number {
  return Math.max(0, Math.min(MAX_MINUTES, minutes));
}

const validators: { [K in keyof SleepSettingsData]: (v: unknown) => v is SleepSettingsData[K] } = {
  isOnboarded: (v): v is boolean => typeof v === 'boolean',
  optimalSleepMinutes: (v): v is number => typeof v === 'number' && Number.isFinite(v),
  optimalWakeMinutes: (v): v is number => typeof v === 'number' && Number.isFinite(v),
  windDownReminderEnabled: (v): v is boolean => typeof v === 'boolean',
  themeMode: (v): v is SleepSettingsData['themeMode'] =>
    v === 'system' || v === 'light' || v === 'dark',
  themePalette: (v): v is SleepSettingsData['themePalette'] =>
    v === 'twilight' || v === 'amethyst',
  liveActivityEnabled: (v): v is boolean => typeof v === 'boolean',
  liveActivityId: (v): v is string | null => v === null || typeof v === 'string',
};

export class SettingsStore {
  constructor(private readonly kv: KeyValueStorage) {}

  get<K extends keyof SleepSettingsData>(key: K): SleepSettingsData[K] {
    const raw = this.kv.getItemSync(PREFIX + key);
    if (raw != null) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (validators[key](parsed)) return parsed;
      } catch {
        // fall through to default
      }
    }
    return DEFAULT_SETTINGS[key];
  }

  set<K extends keyof SleepSettingsData>(key: K, value: SleepSettingsData[K]): void {
    let v: SleepSettingsData[K] = value;
    if (key === 'optimalSleepMinutes' || key === 'optimalWakeMinutes') {
      v = clampMinutes(value as number) as SleepSettingsData[K];
    }
    this.kv.setItemSync(PREFIX + key, JSON.stringify(v));
  }

  load(): SleepSettingsData {
    return {
      isOnboarded: this.get('isOnboarded'),
      optimalSleepMinutes: this.get('optimalSleepMinutes'),
      optimalWakeMinutes: this.get('optimalWakeMinutes'),
      windDownReminderEnabled: this.get('windDownReminderEnabled'),
      themeMode: this.get('themeMode'),
      themePalette: this.get('themePalette'),
      liveActivityEnabled: this.get('liveActivityEnabled'),
      liveActivityId: this.get('liveActivityId'),
    };
  }
}
