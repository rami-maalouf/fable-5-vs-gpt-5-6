import { defaultSleepSettings } from '@/domain/models';

import { createSettingsStore } from './settings-store';

class MemoryStorage {
  values = new Map<string, string>();

  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  async removeItem(key: string) {
    this.values.delete(key);
  }
}

describe('settings store', () => {
  it('returns spec defaults when storage is empty', async () => {
    const store = createSettingsStore(new MemoryStorage());

    expect(await store.getSettings()).toEqual(defaultSleepSettings);
  });

  it('persists settings using the spec key names', async () => {
    const storage = new MemoryStorage();
    const store = createSettingsStore(storage);

    await store.saveSettings({
      ...defaultSleepSettings,
      isOnboarded: true,
      optimalSleepMinutes: 23 * 60,
      optimalWakeMinutes: 6 * 60 + 45,
      liveActivityId: 'activity-1',
    });

    expect(storage.values.get('is_onboarded')).toBe('true');
    expect(storage.values.get('optimal_sleep_minutes')).toBe(String(23 * 60));
    expect(storage.values.get('optimal_wake_minutes')).toBe(String(6 * 60 + 45));
    expect(storage.values.get('wind_down_reminder_enabled')).toBe('true');
    expect(storage.values.get('theme_mode')).toBe('dark');
    expect(storage.values.get('theme_palette')).toBe('twilight');
    expect(storage.values.get('live_activity_enabled')).toBe('true');
    expect(storage.values.get('live_activity_id')).toBe('activity-1');
    expect(await store.getSettings()).toMatchObject({
      isOnboarded: true,
      optimalSleepMinutes: 23 * 60,
      optimalWakeMinutes: 6 * 60 + 45,
      liveActivityId: 'activity-1',
    });
  });
});
