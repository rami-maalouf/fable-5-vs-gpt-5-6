// ports: twilight/models/blockedprofilesessions.swift, twilight/models/sleepsettings.swift

export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemePalette = 'twilight' | 'amethyst';

export interface SleepSession {
  id: string;
  tag: string;
  startTime: number;
  endTime: number | null;
  startTimeZone: string;
  endTimeZone: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface SleepSettings {
  isOnboarded: boolean;
  optimalSleepMinutes: number;
  optimalWakeMinutes: number;
  windDownReminderEnabled: boolean;
  themeMode: ThemeMode;
  themePalette: ThemePalette;
  liveActivityEnabled: boolean;
  liveActivityId: string | null;
}
