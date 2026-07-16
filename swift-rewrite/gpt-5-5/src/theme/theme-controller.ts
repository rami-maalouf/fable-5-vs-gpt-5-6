import type { SleepSettings, ThemeMode, ThemePalette } from '@/domain/models';
import { defaultSleepSettings } from '@/domain/models';

import { settingsStore } from '@/data/settings-store';

import { type AppTheme, type ColorScheme, selectTheme } from './palettes';

export type ThemeSettingsStore = {
  getSettings(): Promise<SleepSettings>;
  updateSettings(patch: Partial<SleepSettings>): Promise<SleepSettings>;
};

export type ThemeState = {
  settings: SleepSettings;
  systemColorScheme: ColorScheme;
  theme: AppTheme;
};

type ThemeListener = (state: ThemeState) => void;

function resolveState(settings: SleepSettings, systemColorScheme: ColorScheme): ThemeState {
  return {
    settings,
    systemColorScheme,
    theme: selectTheme({
      themeMode: settings.themeMode,
      themePalette: settings.themePalette,
      systemColorScheme,
    }),
  };
}

export function createThemeController({
  settingsStore: store = settingsStore,
  systemColorScheme = 'dark',
}: {
  settingsStore?: ThemeSettingsStore;
  systemColorScheme?: ColorScheme;
} = {}) {
  let state = resolveState(defaultSleepSettings, systemColorScheme);
  const listeners = new Set<ThemeListener>();

  function emit() {
    for (const listener of listeners) {
      listener(state);
    }
  }

  async function update(patch: Partial<SleepSettings>) {
    const settings = await store.updateSettings(patch);
    state = resolveState(settings, state.systemColorScheme);
    emit();
    return state;
  }

  return {
    getState() {
      return state;
    },

    subscribe(listener: ThemeListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async load() {
      const settings = await store.getSettings();
      state = resolveState(settings, state.systemColorScheme);
      emit();
      return state;
    },

    setSystemColorScheme(nextSystemColorScheme: ColorScheme) {
      state = resolveState(state.settings, nextSystemColorScheme);
      emit();
      return state;
    },

    setThemeMode(themeMode: ThemeMode) {
      return update({ themeMode });
    },

    setThemePalette(themePalette: ThemePalette) {
      return update({ themePalette });
    },
  };
}
