// ports: twilight/twilightapp.swift

export const TAB_ROUTES = [
  {
    name: 'index',
    label: 'Home',
    sf: { default: 'house', selected: 'house.fill' },
    md: { default: 'home', selected: 'home' },
  },
  {
    name: 'metrics',
    label: 'Metrics',
    sf: { default: 'chart.xyaxis.line', selected: 'chart.xyaxis.line' },
    md: { default: 'analytics', selected: 'analytics' },
  },
  {
    name: 'logs',
    label: 'Logs',
    sf: { default: 'list.bullet.clipboard', selected: 'list.bullet.clipboard' },
    md: { default: 'list_alt', selected: 'list_alt' },
  },
  {
    name: 'settings',
    label: 'Settings',
    sf: { default: 'gearshape', selected: 'gearshape.fill' },
    md: { default: 'settings', selected: 'settings' },
  },
] as const;
