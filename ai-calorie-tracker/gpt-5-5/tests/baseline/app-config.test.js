const { readFileSync } = require('node:fs');
const { join } = require('node:path');

describe('baseline app config', () => {
  const config = JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8')).expo;

  test('uses server output for expo router api routes', () => {
    expect(config.web.output).toBe('server');
  });

  test('declares one small remaining calories widget', () => {
    const widgetPlugin = config.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-widgets');
    const widgets = widgetPlugin[1].widgets;

    expect(widgets).toHaveLength(1);
    expect(widgets[0]).toMatchObject({
      name: 'RemainingCaloriesWidget',
      displayName: 'Nourish',
      supportedFamilies: ['systemSmall'],
    });
  });
});
