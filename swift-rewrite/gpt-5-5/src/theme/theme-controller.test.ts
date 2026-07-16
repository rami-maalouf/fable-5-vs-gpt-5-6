import { defaultSleepSettings } from '@/domain/models';

import { createThemeController } from './theme-controller';

describe('theme controller', () => {
  it('loads settings, persists mode and palette changes, and notifies subscribers', async () => {
    const savedSettings = { ...defaultSleepSettings };
    const updates: string[] = [];
    const store = {
      async getSettings() {
        return savedSettings;
      },
      async updateSettings(patch: Partial<typeof defaultSleepSettings>) {
        Object.assign(savedSettings, patch);
        return savedSettings;
      },
    };
    const controller = createThemeController({ settingsStore: store, systemColorScheme: 'dark' });
    controller.subscribe((state) => updates.push(`${state.settings.themeMode}:${state.settings.themePalette}:${state.theme.id}`));

    await controller.load();
    await controller.setThemePalette('amethyst');
    await controller.setThemeMode('light');

    expect(updates).toEqual(['dark:twilight:twilight', 'dark:amethyst:amethyst', 'light:amethyst:sunset']);
    expect(savedSettings.themeMode).toBe('light');
    expect(savedSettings.themePalette).toBe('amethyst');
  });
});
