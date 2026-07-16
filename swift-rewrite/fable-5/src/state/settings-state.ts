// reactive mirror of the kv settings store so goal/toggle changes flow into
// the dashboard, editor and notifications immediately (SleepSettings.shared
// was an ObservableObject in the original)
import { create } from 'zustand';

import { settingsStore } from '../data/app-db';
import type { SleepSettingsData } from '../domain/models';

interface SettingsState extends SleepSettingsData {
  setSetting: <K extends keyof SleepSettingsData>(key: K, value: SleepSettingsData[K]) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  ...settingsStore.load(),
  setSetting: (key, value) => {
    settingsStore.set(key, value);
    // read back so clamping in the store is reflected
    set({ [key]: settingsStore.get(key) } as Partial<SettingsState>);
  },
}));
