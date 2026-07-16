import { render } from '@testing-library/react-native';

import DashboardScreen from '@/app/(tabs)/index';
import { SettingsStore, type KeyValueStorage } from '@/data/settings-store';
import { ThemeProvider } from '@/theme/ThemeProvider';

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
  test('dashboard renders inside the theme provider', async () => {
    const { getByText } = await render(
      <ThemeProvider store={new SettingsStore(memoryKv())}>
        <DashboardScreen />
      </ThemeProvider>
    );
    // week chart x labels render (spike harness data)
    getByText('Sat');
  });
});
