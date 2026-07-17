// guards the app config required by the benchmark prompt: server output for the
// api route and exactly one small remaining-calories widget.
import appConfig from '../../app.json';

describe('app config baseline', () => {
  it('enables server output for the scan api route', () => {
    expect(appConfig.expo.web.output).toBe('server');
  });

  it('configures exactly one small RemainingCaloriesWidget', () => {
    const widgetsPlugin = appConfig.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-widgets',
    );
    expect(widgetsPlugin).toBeDefined();

    const pluginOptions = (widgetsPlugin as [string, { widgets: unknown }])[1];
    const widgets = pluginOptions.widgets as {
      name: string;
      supportedFamilies: string[];
    }[];
    expect(widgets).toHaveLength(1);
    expect(widgets[0].name).toBe('RemainingCaloriesWidget');
    expect(widgets[0].supportedFamilies).toEqual(['systemSmall']);
  });
});
