import type { SleepSession } from '@/domain/models';
import {
  getSessionDurationSeconds,
  selectCanonicalSessionsByWakeDay,
} from '@/domain/session-rules';

export const SLEEP_ANALYSIS_BASE_HOUR = 18;
export const DEFAULT_MOVING_AVERAGE_WINDOW = 7;
export const DEFAULT_GOAL_TOLERANCE_HOURS = 0.75;

const millisecondsPerDay = 24 * 60 * 60 * 1_000;
const timeFormatterByZone = new Map<string, Intl.DateTimeFormat>();

export interface SleepNightRecord {
  bedtimeOffset: number;
  date: number;
  dayKey: string;
  durationHours: number;
  id: string;
  midpointOffset: number;
  wakeOffset: number;
  weekday: number;
}

export interface SleepMovingAveragePoint {
  date: number;
  dayKey: string;
  durationHours: number;
  movingAverageHours: number | null;
}

interface CoverageOptions {
  days: number | null;
  referenceDayKey: string;
}

export function createNightRecords(sessions: readonly SleepSession[]): SleepNightRecord[] {
  const canonical = selectCanonicalSessionsByWakeDay(sessions);
  return [...canonical.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dayKey, session]) => createNightRecord(dayKey, session));
}

export function averageDuration(records: readonly SleepNightRecord[]): number | null {
  return average(records.map((record) => record.durationHours));
}

export function medianDuration(records: readonly SleepNightRecord[]): number | null {
  const values = records.map((record) => record.durationHours).sort((left, right) => left - right);
  if (values.length === 0) {
    return null;
  }
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0 ? (values[middle - 1] + values[middle]) / 2 : values[middle];
}

export function totalSleepHours(records: readonly SleepNightRecord[]): number {
  return records.reduce((total, record) => total + record.durationHours, 0);
}

export function longestNight(records: readonly SleepNightRecord[]): number | null {
  return records.length === 0 ? null : Math.max(...records.map((record) => record.durationHours));
}

export function shortestNight(records: readonly SleepNightRecord[]): number | null {
  const durations = records.map((record) => record.durationHours).filter((duration) => duration > 0);
  return durations.length === 0 ? null : Math.min(...durations);
}

export function recordsInRange(
  records: readonly SleepNightRecord[],
  days: number | null,
  referenceDayKey: string,
): SleepNightRecord[] {
  if (days === null) {
    return [...records];
  }
  assertPositiveWindow(days);
  const startDay = shiftDayKey(referenceDayKey, -(days - 1));
  return records.filter((record) => record.dayKey >= startDay && record.dayKey <= referenceDayKey);
}

export function trackingCoverage(
  records: readonly SleepNightRecord[],
  options: CoverageOptions,
): number {
  if (records.length === 0) {
    return 0;
  }
  const denominator = options.days === null
    ? Math.max(1, daysInclusive(records[0].dayKey, options.referenceDayKey))
    : positiveWindow(options.days);
  return Math.round(clamp(records.length / denominator, 0, 1) * 100);
}

export function goalDurationHours(sleepMinutes: number, wakeMinutes: number): number {
  const sleep = normalizeMinutes(sleepMinutes);
  const wake = normalizeMinutes(wakeMinutes);
  const durationMinutes = wake - sleep;
  return (durationMinutes < 0 ? durationMinutes + 24 * 60 : durationMinutes) / 60;
}

export function goalHitRate(
  records: readonly SleepNightRecord[],
  targetDurationHours: number,
  toleranceHours = DEFAULT_GOAL_TOLERANCE_HOURS,
): number {
  if (records.length === 0) {
    return 0;
  }
  const hits = records.filter(
    (record) => Math.abs(record.durationHours - targetDurationHours) <= toleranceHours,
  ).length;
  return Math.round((hits / records.length) * 100);
}

export function durationTrendPercent(
  records: readonly SleepNightRecord[],
  window = DEFAULT_MOVING_AVERAGE_WINDOW,
): number | null {
  assertPositiveWindow(window);
  if (records.length < window * 2) {
    return null;
  }
  const current = averageDuration(records.slice(-window));
  const previous = averageDuration(records.slice(-window * 2, -window));
  if (current === null || previous === null || previous <= 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

export function movingAverageSeries(
  records: readonly SleepNightRecord[],
  window = DEFAULT_MOVING_AVERAGE_WINDOW,
): SleepMovingAveragePoint[] {
  assertPositiveWindow(window);
  let rollingSum = 0;
  return records.map((record, index) => {
    rollingSum += record.durationHours;
    if (index >= window) {
      rollingSum -= records[index - window].durationHours;
    }
    return {
      date: record.date,
      dayKey: record.dayKey,
      durationHours: record.durationHours,
      movingAverageHours: index + 1 >= window ? rollingSum / window : null,
    };
  });
}

export function currentStreak(
  records: readonly SleepNightRecord[],
  referenceDayKey: string,
): number {
  const trackedDays = new Set(records.map((record) => record.dayKey));
  let currentDay = referenceDayKey;
  if (!trackedDays.has(currentDay)) {
    const yesterday = shiftDayKey(currentDay, -1);
    if (!trackedDays.has(yesterday)) {
      return 0;
    }
    currentDay = yesterday;
  }

  let streak = 0;
  while (trackedDays.has(currentDay)) {
    streak += 1;
    currentDay = shiftDayKey(currentDay, -1);
  }
  return streak;
}

export function longestStreak(records: readonly SleepNightRecord[]): number {
  const days = [...new Set(records.map((record) => record.dayKey))].sort();
  if (days.length === 0) {
    return 0;
  }
  let longest = 1;
  let current = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (daysInclusive(days[index - 1], days[index]) === 2) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

function createNightRecord(dayKey: string, session: SleepSession): SleepNightRecord {
  if (session.endTime === null) {
    throw new Error(`Cannot create a night record from active session ${session.id}`);
  }
  const durationHours = Math.max(0, (getSessionDurationSeconds(session) ?? 0) / 3600);
  const bedtimeOffset = timeOffsetHours(session.startTime, session.startTimeZone);
  const wakeOffset = timeOffsetHours(
    session.endTime,
    session.endTimeZone ?? session.startTimeZone,
  );
  const date = normalizedDayTimestamp(dayKey);
  return {
    bedtimeOffset,
    date,
    dayKey,
    durationHours,
    id: session.id,
    midpointOffset: bedtimeOffset + durationHours / 2,
    wakeOffset,
    weekday: new Date(dayOrdinal(dayKey) * millisecondsPerDay).getUTCDay() + 1,
  };
}

function timeOffsetHours(timestamp: number, timeZone: string): number {
  const parts = timeFormatter(timeZone).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const localHour = Number(values.hour) % 24 + Number(values.minute) / 60;
  const adjustedHour = localHour < SLEEP_ANALYSIS_BASE_HOUR ? localHour + 24 : localHour;
  return adjustedHour - SLEEP_ANALYSIS_BASE_HOUR;
}

function timeFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = timeFormatterByZone.get(timeZone);
  if (cached) {
    return cached;
  }
  let created: Intl.DateTimeFormat;
  try {
    created = new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit',
      hourCycle: 'h23',
      minute: '2-digit',
      timeZone,
    });
  } catch {
    throw new Error(`Invalid IANA time zone: ${timeZone}`);
  }
  timeFormatterByZone.set(timeZone, created);
  return created;
}

function average(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((total, value) => total + value, 0) / values.length;
}

function normalizeMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) {
    throw new Error(`Invalid minutes since midnight: ${minutes}`);
  }
  return ((Math.trunc(minutes) % (24 * 60)) + 24 * 60) % (24 * 60);
}

function daysInclusive(startDayKey: string, endDayKey: string): number {
  return Math.floor((dayOrdinal(endDayKey) - dayOrdinal(startDayKey)) + 1);
}

function shiftDayKey(dayKey: string, days: number): string {
  const date = new Date((dayOrdinal(dayKey) + days) * millisecondsPerDay);
  return date.toISOString().slice(0, 10);
}

function normalizedDayTimestamp(dayKey: string): number {
  const [year, month, day] = dayKey.split('-').map(Number);
  dayOrdinal(dayKey);
  return new Date(year, month - 1, day, 12).getTime();
}

function dayOrdinal(dayKey: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) {
    throw new Error(`Invalid day key: ${dayKey}`);
  }
  const timestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (new Date(timestamp).toISOString().slice(0, 10) !== dayKey) {
    throw new Error(`Invalid day key: ${dayKey}`);
  }
  return timestamp / millisecondsPerDay;
}

function positiveWindow(value: number): number {
  assertPositiveWindow(value);
  return value;
}

function assertPositiveWindow(value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Window must be a positive integer: ${value}`);
  }
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.min(Math.max(value, lower), upper);
}
