// ports: Models/BlockedProfileSessions.swift (validity, sleepDate, canonical night),
// Models/SleepSettings.swift (sleepGoalSeconds), Views/Logs/SleepSessionEditorView.swift
// (goal match), Utils/DateFormatters.swift (formatters)
// pure ts - no react or expo imports

import type { CalendarDay, SleepSession } from './models';

// minimum session duration (5 minutes) to be considered valid sleep
export const MINIMUM_SESSION_SECONDS = 5 * 60;

export function sessionDurationSeconds(session: SleepSession, nowMs = Date.now()): number {
  const end = session.endTime ?? nowMs;
  return (end - session.startTime) / 1000;
}

// valid = at least 5 minutes (>= boundary, matching swift's isValidSession)
export function isValidSession(session: SleepSession, nowMs = Date.now()): boolean {
  return sessionDurationSeconds(session, nowMs) >= MINIMUM_SESSION_SECONDS;
}

// end timezone falls back to start timezone, matching swift's endTimeZone computed var
export function resolveEndTimeZone(session: SleepSession): string {
  return session.endTimeZone ?? session.startTimeZone;
}

interface ZonedParts extends CalendarDay {
  hour: number;
  minute: number;
  second: number;
}

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let fmt = partsFormatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    partsFormatters.set(timeZone, fmt);
  }
  return fmt;
}

// wall-clock components of an instant in an arbitrary iana timezone
export function zonedParts(epochMs: number, timeZone: string): ZonedParts {
  const parts = formatterFor(timeZone).formatToParts(epochMs);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  // hour12: false can yield 24 for midnight in some engines; normalize
  const hour = get('hour') % 24;
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour,
    minute: get('minute'),
    second: get('second'),
  };
}

export function dayKey(day: CalendarDay): string {
  const mm = String(day.month).padStart(2, '0');
  const dd = String(day.day).padStart(2, '0');
  return `${day.year}-${mm}-${dd}`;
}

// calendar-date arithmetic via utc so it never touches the device timezone
export function addDays(day: CalendarDay, delta: number): CalendarDay {
  const d = new Date(Date.UTC(day.year, day.month - 1, day.day + delta));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function diffDays(from: CalendarDay, to: CalendarDay): number {
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((b - a) / 86_400_000);
}

// 0 = sunday ... 6 = saturday, matching swift Calendar weekday - 1
export function weekdayOf(day: CalendarDay): number {
  return new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
}

// the canonical date a sleep session belongs to, based on wake time (swift sleepDate).
// active sessions estimate the wake day as the day after start.
export function wakeDay(session: SleepSession): CalendarDay {
  const tz = resolveEndTimeZone(session);
  if (session.endTime == null) {
    const startDay = zonedParts(session.startTime, tz);
    return addDays({ year: startDay.year, month: startDay.month, day: startDay.day }, 1);
  }
  const p = zonedParts(session.endTime, tz);
  return { year: p.year, month: p.month, day: p.day };
}

// when a wake day has several sessions, the longest is the canonical night
export function canonicalNight(
  sessions: readonly SleepSession[],
  nowMs = Date.now()
): SleepSession | null {
  let best: SleepSession | null = null;
  let bestDuration = -Infinity;
  for (const s of sessions) {
    const d = sessionDurationSeconds(s, nowMs);
    if (d > bestDuration) {
      best = s;
      bestDuration = d;
    }
  }
  return best;
}

// ports SleepSettings.sleepGoalSeconds: wake - sleep in minutes, wrapped past midnight
export function sleepGoalSeconds(optimalSleepMinutes: number, optimalWakeMinutes: number): number {
  let diff = optimalWakeMinutes - optimalSleepMinutes;
  if (diff <= 0) diff += 24 * 60;
  return diff * 60;
}

// ports the editor's wrappedMinuteDifference: shortest way around the 24h clock
export function wrappedMinuteDifference(lhs: number, rhs: number): number {
  const raw = Math.abs(lhs - rhs) % (24 * 60);
  return Math.min(raw, 24 * 60 - raw);
}

// ports the editor's averageGoalDeviationMinutes (integer division like swift)
export function averageGoalDeviationMinutes(
  sleepActualMinutes: number,
  wakeActualMinutes: number,
  optimalSleepMinutes: number,
  optimalWakeMinutes: number
): number {
  const total =
    wrappedMinuteDifference(sleepActualMinutes, optimalSleepMinutes) +
    wrappedMinuteDifference(wakeActualMinutes, optimalWakeMinutes);
  return Math.trunc(total / 2);
}

// ports the editor's goalMatchScore: -30 pts per hour of average deviation
export function goalMatchScore(
  sleepActualMinutes: number,
  wakeActualMinutes: number,
  optimalSleepMinutes: number,
  optimalWakeMinutes: number
): number {
  const deviation = averageGoalDeviationMinutes(
    sleepActualMinutes,
    wakeActualMinutes,
    optimalSleepMinutes,
    optimalWakeMinutes
  );
  const deduction = Math.trunc((deviation / 60) * 30);
  return Math.max(0, 100 - deduction);
}

export function goalMatchSubtitle(deviationMinutes: number): string {
  if (deviationMinutes === 0) return 'Exactly on target';
  if (deviationMinutes <= 5) return 'Within 5 min';
  return `${deviationMinutes}m avg off goal`;
}

// ports DateFormatters.formatDuration ("7h 32m 5s" / "32m 5s" / "42s")
export function formatDuration(durationSeconds: number): string {
  const total = Math.trunc(durationSeconds);
  const hours = Math.trunc(total / 3600);
  const minutes = Math.trunc((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// ports DateFormatters.formatMinutes ("45 min" / "2h" / "2h 12m"; <= 60 stays in minutes)
export function formatMinutes(durationInMinutes: number): string {
  if (durationInMinutes <= 60) return `${durationInMinutes} min`;
  const hours = Math.trunc(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}
