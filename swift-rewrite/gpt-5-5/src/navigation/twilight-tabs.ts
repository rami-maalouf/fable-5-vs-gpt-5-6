import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

export type TwilightTab = {
  route: string;
  label: string;
  sfSymbol: SFSymbol;
  materialSymbol: AndroidSymbol;
};

export const twilightTabs = [
  {
    route: 'index',
    label: 'Home',
    sfSymbol: 'house.fill',
    materialSymbol: 'home',
  },
  {
    route: 'metrics',
    label: 'Metrics',
    sfSymbol: 'chart.xyaxis.line',
    materialSymbol: 'bar_chart',
  },
  {
    route: 'logs',
    label: 'Logs',
    sfSymbol: 'list.bullet.clipboard',
    materialSymbol: 'list_alt',
  },
  {
    route: 'settings',
    label: 'Settings',
    sfSymbol: 'gearshape.fill',
    materialSymbol: 'settings',
  },
] as const satisfies readonly TwilightTab[];

export const twilightTabsByRoute = {
  index: twilightTabs[0],
  metrics: twilightTabs[1],
  logs: twilightTabs[2],
  settings: twilightTabs[3],
} as const;
