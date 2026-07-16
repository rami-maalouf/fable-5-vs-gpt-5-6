import { describe, expect, it } from '@jest/globals';

const appConfig = require('../../app.json');

function pluginNames() {
  return appConfig.expo.plugins.map((plugin: string | [string, Record<string, unknown>]) => (
    Array.isArray(plugin) ? plugin[0] : plugin
  ));
}

function pluginConfig(name: string) {
  const plugin = appConfig.expo.plugins.find((
    item: string | [string, Record<string, unknown>]
  ) => Array.isArray(item) && item[0] === name);

  return Array.isArray(plugin) ? plugin[1] : undefined;
}

describe('app config launch appearance', () => {
  it('uses automatic system appearance with a neutral launch background', () => {
    const splashConfig = pluginConfig('expo-splash-screen');

    expect(appConfig.expo.userInterfaceStyle).toBe('automatic');
    expect(appConfig.expo.backgroundColor).toBe('#ffffff');
    expect(appConfig.expo.ios.backgroundColor).toBe('#ffffff');
    expect(pluginNames()).toContain('expo-system-ui');
    expect(pluginNames()).toContain('expo-splash-screen');
    expect(splashConfig).toMatchObject({
      backgroundColor: '#ffffff',
      dark: {
        backgroundColor: '#000000',
      },
    });
  });
});
