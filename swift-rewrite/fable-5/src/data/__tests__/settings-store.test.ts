import { DEFAULT_SETTINGS } from '../../domain/models';
import { SettingsStore, type KeyValueStorage } from '../settings-store';

function memoryKv(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItemSync: (key) => map.get(key) ?? null,
    setItemSync: (key, value) => {
      map.set(key, value);
    },
  };
}

describe('SettingsStore', () => {
  test('defaults match the spec (dark mode, twilight palette, wind-down on, live activity on)', () => {
    const store = new SettingsStore(memoryKv());
    const s = store.load();
    expect(s).toEqual(DEFAULT_SETTINGS);
    expect(s.themeMode).toBe('dark');
    expect(s.themePalette).toBe('twilight');
    expect(s.windDownReminderEnabled).toBe(true);
    expect(s.liveActivityEnabled).toBe(true);
    expect(s.isOnboarded).toBe(false);
    expect(s.optimalSleepMinutes).toBe(22 * 60);
    expect(s.optimalWakeMinutes).toBe(7 * 60);
  });

  test('writes persist and round-trip', () => {
    const kv = memoryKv();
    const store = new SettingsStore(kv);
    store.set('optimalSleepMinutes', 23 * 60 + 30);
    store.set('themePalette', 'amethyst');
    store.set('isOnboarded', true);
    store.set('liveActivityId', 'activity-123');

    const reloaded = new SettingsStore(kv).load();
    expect(reloaded.optimalSleepMinutes).toBe(23 * 60 + 30);
    expect(reloaded.themePalette).toBe('amethyst');
    expect(reloaded.isOnboarded).toBe(true);
    expect(reloaded.liveActivityId).toBe('activity-123');
  });

  test('sleep/wake minutes are clamped to 0..1439 like the swift store', () => {
    const store = new SettingsStore(memoryKv());
    store.set('optimalSleepMinutes', -10);
    expect(store.load().optimalSleepMinutes).toBe(0);
    store.set('optimalWakeMinutes', 24 * 60 + 50);
    expect(store.load().optimalWakeMinutes).toBe(24 * 60 - 1);
  });

  test('corrupt stored values fall back to defaults', () => {
    const kv = memoryKv();
    kv.setItemSync('twilight.settings.themeMode', '"broken-value"');
    kv.setItemSync('twilight.settings.optimalSleepMinutes', 'not json {');
    const s = new SettingsStore(kv).load();
    expect(s.themeMode).toBe('dark');
    expect(s.optimalSleepMinutes).toBe(22 * 60);
  });
});
