// ports: Views/SleepDataModels.swift - SleepDataUtils.process + the weekly
// consistency/accuracy scoring used by the dashboard insight pills
// pure ts
import type { CalendarDay, SleepSession } from '../models';
import {
  addDays,
  dayKey,
  resolveEndTimeZone,
  sessionDurationSeconds,
  wakeDay,
  weekdayOf,
} from '../session-rules';
import { timeOffsetFromMinutes, timeOffsetOfInstant } from './chart-data';

export interface DailySleepData {
  day: CalendarDay;
  dayLabel: string;
  startOffset: number;
  endOffset: number;
  durationSeconds: number;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// last 7 wake days anchored at the most recent session's wake day; empty days
// are zero-duration placeholders, canonical (longest) session wins per day
export function processWeekData(sessions: readonly SleepSession[]): DailySleepData[] {
  const valid = sessions
    .filter((s) => s.endTime != null)
    .sort((a, b) => a.startTime - b.startTime);
  if (valid.length === 0) return [];

  const anchor = wakeDay(valid[valid.length - 1]);

  const canonicalByDay = new Map<string, SleepSession>();
  for (const session of valid) {
    const key = dayKey(wakeDay(session));
    const existing = canonicalByDay.get(key);
    if (!existing || sessionDurationSeconds(session) > sessionDurationSeconds(existing)) {
      canonicalByDay.set(key, session);
    }
  }

  const data: DailySleepData[] = [];
  for (let i = 6; i >= 0; i--) {
    const target = addDays(anchor, -i);
    const dayLabel = WEEKDAY_NAMES[weekdayOf(target)];
    const session = canonicalByDay.get(dayKey(target));
    if (session && session.endTime != null) {
      data.push({
        day: target,
        dayLabel,
        startOffset: timeOffsetOfInstant(session.startTime, session.startTimeZone),
        endOffset: timeOffsetOfInstant(session.endTime, resolveEndTimeZone(session)),
        durationSeconds: sessionDurationSeconds(session),
      });
    } else {
      data.push({ day: target, dayLabel, startOffset: 0, endOffset: 0, durationSeconds: 0 });
    }
  }
  return data;
}

export function trackedDataPoints(data: readonly DailySleepData[]): DailySleepData[] {
  return data.filter((d) => d.durationSeconds > 0);
}

export function averageWeekDurationSeconds(data: readonly DailySleepData[]): number {
  const active = trackedDataPoints(data);
  if (active.length === 0) return 0;
  return active.reduce((sum, d) => sum + d.durationSeconds, 0) / active.length;
}

function consistencyFor(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, 100 - Math.trunc(stdDev * 40));
}

export function weekSleepConsistency(data: readonly DailySleepData[]): number {
  return consistencyFor(trackedDataPoints(data).map((d) => d.startOffset));
}

export function weekWakeConsistency(data: readonly DailySleepData[]): number {
  return consistencyFor(trackedDataPoints(data).map((d) => d.endOffset));
}

export function weekAccuracy(
  data: readonly DailySleepData[],
  optimalSleepMinutes: number | null,
  optimalWakeMinutes: number | null
): number {
  const active = trackedDataPoints(data);
  if (active.length === 0 || optimalSleepMinutes == null || optimalWakeMinutes == null) return 0;
  const targetSleep = timeOffsetFromMinutes(optimalSleepMinutes);
  const targetWake = timeOffsetFromMinutes(optimalWakeMinutes);
  const totalDeviation = active.reduce(
    (sum, d) => sum + Math.abs(d.startOffset - targetSleep) + Math.abs(d.endOffset - targetWake),
    0
  );
  const avgDeviation = totalDeviation / (active.length * 2);
  return Math.max(0, 100 - Math.trunc(avgDeviation * 30));
}

// "7h 1m" split used by the avg-sleep insight pill
export function formatAvgDuration(durationSeconds: number): { hours: string; minutes: string } {
  const total = Math.trunc(durationSeconds);
  return { hours: String(Math.trunc(total / 3600)), minutes: String(Math.trunc((total % 3600) / 60)) };
}
