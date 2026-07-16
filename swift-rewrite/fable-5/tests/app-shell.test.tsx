import { render } from '@testing-library/react-native';

import { SettingsStore, type KeyValueStorage } from '@/data/settings-store';
import { ThemeProvider } from '@/theme/ThemeProvider';

// the app db module opens expo-sqlite natively; back it with node:sqlite in jest
jest.mock('@/data/app-db', () => {
  const { memoryDb } = require('./helpers/memory-db');
  const { migrate } = require('@/data/db');
  const { SessionRepo } = require('@/data/session-repo');
  const db = memoryDb();
  migrate(db);
  return { sessionRepo: new SessionRepo(db), settingsStore: null };
});

// the skia jest mock has no CanvasKit, so path construction is stubbed;
// chart marks render as noop views while text overlays stay real
jest.mock('@/components/charts/path-utils', () => ({
  catmullRomPath: () => null,
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
