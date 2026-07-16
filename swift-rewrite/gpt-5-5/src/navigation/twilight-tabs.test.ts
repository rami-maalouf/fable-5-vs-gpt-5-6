import { twilightTabs } from './twilight-tabs';

describe('twilight tab scaffold', () => {
  it('defines the required tabs in the specified order', () => {
    expect(twilightTabs.map((tab) => tab.route)).toEqual(['index', 'metrics', 'logs', 'settings']);
    expect(twilightTabs.map((tab) => tab.label)).toEqual(['Home', 'Metrics', 'Logs', 'Settings']);
  });

  it('uses the required sf symbol names for ios tabs', () => {
    expect(twilightTabs.map((tab) => tab.sfSymbol)).toEqual([
      'house.fill',
      'chart.xyaxis.line',
      'list.bullet.clipboard',
      'gearshape.fill',
    ]);
  });
});
