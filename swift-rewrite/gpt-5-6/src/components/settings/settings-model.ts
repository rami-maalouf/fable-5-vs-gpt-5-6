// ports: twilight/models/sleepsettings.swift

import type { ThemeMode } from '@/domain/models';
import { goalDurationHours } from '@/domain/metrics/core';

const minutesPerDay = 24 * 60;

export const SETTINGS_MODE_OPTIONS: readonly { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Sunset', value: 'light' },
  { label: 'Night', value: 'dark' },
];

function normalizeMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) {
    throw new Error(`Invalid minutes since midnight: ${minutes}`);
  }
  return ((Math.trunc(minutes) % minutesPerDay) + minutesPerDay) % minutesPerDay;
}

export function minutesSinceMidnightFromDate(date: Date): number {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid picker date');
  }
  return date.getHours() * 60 + date.getMinutes();
}

export function dateFromMinutesSinceMidnight(minutes: number): Date {
  const normalized = normalizeMinutes(minutes);
  return new Date(2001, 0, 1, Math.floor(normalized / 60), normalized % 60);
}

export function formatGoalDuration(sleepMinutes: number, wakeMinutes: number): string {
  const totalMinutes = Math.round(goalDurationHours(sleepMinutes, wakeMinutes) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `Goal: ${hours} hr` : `Goal: ${hours} hr ${minutes} min`;
}
