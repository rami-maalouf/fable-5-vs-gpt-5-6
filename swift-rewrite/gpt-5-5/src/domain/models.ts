export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemePalette = 'twilight' | 'amethyst';

export type SleepSession = {
  id: string;
  startTime: Date;
  endTime: Date | null;
  startTimeZone: string;
  endTimeZone: string | null;
  createdAt: Date;
  updatedAt: Date;
  tag?: string | null;
  notes?: string | null;
  forceStarted?: boolean;
};

export type SleepSettings = {
  isOnboarded: boolean;
  optimalSleepMinutes: number;
  optimalWakeMinutes: number;
  themeMode: ThemeMode;
  themePalette: ThemePalette;
  windDownEnabled: boolean;
  liveActivityEnabled: boolean;
  liveActivityId: string | null;
};

export const defaultSleepSettings: SleepSettings = {
  isOnboarded: false,
  optimalSleepMinutes: 22 * 60,
  optimalWakeMinutes: 7 * 60,
  themeMode: 'dark',
  themePalette: 'twilight',
  windDownEnabled: true,
  liveActivityEnabled: true,
  liveActivityId: null,
};
