// ports: Models/BlockedProfileSessions.swift (sleep-relevant fields), Models/SleepSettings.swift
// pure ts - no react or expo imports allowed in src/domain

export interface SleepSession {
  id: string;
  // "Manual Log" for editor-created entries
  tag: string;
  // epoch ms
  startTime: number;
  // epoch ms; null = active session
  endTime: number | null;
  // iana identifiers - timezone correctness is load-bearing
  startTimeZone: string;
  endTimeZone: string | null;
  createdAt: number;
  updatedAt: number;
}

export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemePalette = 'twilight' | 'amethyst';

export interface SleepSettingsData {
  isOnboarded: boolean;
  // minutes since midnight; defaults 22:00 / 07:00 per SleepSettings.swift
  optimalSleepMinutes: number;
  optimalWakeMinutes: number;
  windDownReminderEnabled: boolean;
  themeMode: ThemeMode;
  themePalette: ThemePalette;
  liveActivityEnabled: boolean;
  liveActivityId: string | null;
}

export const DEFAULT_SETTINGS: SleepSettingsData = {
  isOnboarded: false,
  optimalSleepMinutes: 22 * 60,
  optimalWakeMinutes: 7 * 60,
  windDownReminderEnabled: true,
  themeMode: 'dark',
  themePalette: 'twilight',
  liveActivityEnabled: true,
  liveActivityId: null,
};

// a wall-clock calendar day (month is 1-based), independent of any timezone instant
export interface CalendarDay {
  year: number;
  month: number;
  day: number;
}
