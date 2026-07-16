import { render } from '@testing-library/react-native';

import { SettingsStore, type KeyValueStorage } from '@/data/settings-store';
import { ThemeProvider } from '@/theme/ThemeProvider';

// the app db module opens expo-sqlite natively; back it with node:sqlite in jest
jest.mock('@/data/app-db', () => {
  const { memoryDb } = require('./helpers/memory-db');
  const { migrate } = require('@/data/db');
  const { SessionRepo } = require('@/data/session-repo');
  const { SettingsStore } = require('@/data/settings-store');
  const db = memoryDb();
  migrate(db);
  const map = new Map<string, string>();
  const kv = {
    getItemSync: (key: string) => map.get(key) ?? null,
    setItemSync: (key: string, value: string) => {
      map.set(key, value);
    },
  };
  return { sessionRepo: new SessionRepo(db), settingsStore: new SettingsStore(kv) };
});

// the skia jest mock has no CanvasKit, so path construction is stubbed;
// chart marks render as noop views while text overlays stay real
jest.mock('@/components/charts/path-utils', () => ({
  catmullRomPath: () => null,
}));

// the screen renders outside a navigator in this smoke test
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useFocusEffect: jest.fn(),
  router: { push: jest.fn(), back: jest.fn() },
}));

import DashboardScreen from '@/app/(tabs)/index';

function memoryKv(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItemSync: (key) => map.get(key) ?? null,
    setItemSync: (key, value) => {
      map.set(key, value);
    },
  };
}

describe('app shell', () => {
  test('dashboard renders the sleep toggle', async () => {
    const { getByText } = await render(
      <ThemeProvider store={new SettingsStore(memoryKv())}>
        <DashboardScreen />
      </ThemeProvider>
    );
    getByText('Go to Sleep');
    getByText('Start tonight!');
    getByText('Tap to start');
  });
});
