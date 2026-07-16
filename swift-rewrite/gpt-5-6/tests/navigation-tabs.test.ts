import { TAB_ROUTES } from '../src/navigation/tabs';

describe('tab routes', () => {
  it('defines the four sleep-core tabs in product order', () => {
    expect(TAB_ROUTES.map(({ name, label }) => ({ name, label }))).toEqual([
      { name: 'index', label: 'Home' },
      { name: 'metrics', label: 'Metrics' },
      { name: 'logs', label: 'Logs' },
      { name: 'settings', label: 'Settings' },
    ]);
  });

  it('uses the specified sf symbol for each tab', () => {
    expect(TAB_ROUTES.map(({ sf }) => sf.selected)).toEqual([
      'house.fill',
      'chart.xyaxis.line',
      'list.bullet.clipboard',
      'gearshape.fill',
    ]);
  });
});
