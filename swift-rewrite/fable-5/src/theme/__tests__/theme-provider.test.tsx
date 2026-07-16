import { render, userEvent } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { SettingsStore, type KeyValueStorage } from '../../data/settings-store';
import { ThemeProvider, useTheme, useThemeControls } from '../ThemeProvider';

function memoryKv(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItemSync: (key) => map.get(key) ?? null,
    setItemSync: (key, value) => {
      map.set(key, value);
    },
  };
}

function Probe() {
  const theme = useTheme();
  const { setMode, setPalette } = useThemeControls();
  return (
    <>
      <Text testID="palette-name">{theme.name}</Text>
      <Pressable testID="pick-amethyst" onPress={() => setPalette('amethyst')} />
      <Pressable testID="pick-light" onPress={() => setMode('light')} />
    </>
  );
}

describe('ThemeProvider', () => {
  test('defaults to the twilight night palette', async () => {
    const store = new SettingsStore(memoryKv());
    const { getByTestId } = await render(
      <ThemeProvider store={store}>
        <Probe />
      </ThemeProvider>
    );
    expect(getByTestId('palette-name').props.children).toBe('twilight');
  });

  test('switching palette and mode updates live and persists', async () => {
    const kv = memoryKv();
    const store = new SettingsStore(kv);
    const { getByTestId } = await render(
      <ThemeProvider store={store}>
        <Probe />
      </ThemeProvider>
    );

    const user = userEvent.setup();
    await user.press(getByTestId('pick-amethyst'));
    expect(getByTestId('palette-name').props.children).toBe('amethyst');

    await user.press(getByTestId('pick-light'));
    expect(getByTestId('palette-name').props.children).toBe('sunset');

    // persisted for next launch
    expect(new SettingsStore(kv).get('themePalette')).toBe('amethyst');
    expect(new SettingsStore(kv).get('themeMode')).toBe('light');
  });
});
