// ports: twilight/utils/sleepmetricsanalyzer.swift

import type { SleepSession } from '../models';
import {
  canonicalSessionsByWakeDay,
  durationSeconds,
  getWakeDayKey,
  minutesSinceStartOfDay,
} from '../session-rules';

export type MetricsRange = '30D' | '90D' | '1Y' | 'All';

export type SleepNightRecord = {
  bedtimeOffsetHours: number;
  date: Date;
  dateKey: string;
  durationHours: number;
  midpointOffsetHours: number;
  sessionId: string;
  wakeOffsetHours: number;
  weekday: number;
};

export type MovingAveragePoint = {
  dateKey: string;
  movingAverageHours: number | null;
};

type TrackingCoverageOptions = {
  allRecords?: readonly SleepNightRecord[];
  referenceDate?: Date;
};

const baseHour = 18;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const rangeDayCounts = {
  '30D': 30,
  '90D': 90,
  '1Y': 365,
} satisfies Record<Exclude<MetricsRange, 'All'>, number>;

function roundToHundredths(value: number) {
  return Math.round(value * 100) / 100;
}

function dateKeyToDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function dateKeyFromDate(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    calendar: 'iso8601',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDaysToDateKey(dateKey: string, deltaDays: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + deltaDays, 12));
  return date.toISOString().slice(0, 10);
}

function daysBetweenDateKeys(startDateKey: string, endDateKey: string) {
  return Math.round((dateKeyToDate(endDateKey).getTime() - dateKeyToDate(startDateKey).getTime()) / millisecondsPerDay);
}

function weekdayForDateKey(dateKey: string) {
  return dateKeyToDate(dateKey).getUTCDay() + 1;
}

function timeOffsetHours(date: Date, timeZone: string) {
  const clockHours = minutesSinceStartOfDay(date, timeZone) / 60;
  const adjustedHours = clockHours < baseHour ? clockHours + 24 : clockHours;
  return roundToHundredths(adjustedHours - baseHour);
}

function average(values: readonly number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sortedByDate(records: readonly SleepNightRecord[]) {
  return [...records].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

export function buildNightRecords(sessions: readonly SleepSession[]): SleepNightRecord[] {
  return canonicalSessionsByWakeDay(sessions).flatMap((session) => {
    if (!session.endTime) {
      return [];
    }

    const dateKey = getWakeDayKey(session);
    const durationHours = roundToHundredths(durationSeconds(session) / 3600);
    const bedtimeOffsetHours = timeOffsetHours(session.startTime, session.startTimeZone);
    const wakeOffsetHours = timeOffsetHours(session.endTime, session.endTimeZone ?? session.startTimeZone);

    return [
      {
        bedtimeOffsetHours,
        date: dateKeyToDate(dateKey),
        dateKey,
        durationHours,
        midpointOffsetHours: roundToHundredths(bedtimeOffsetHours + durationHours / 2),
        sessionId: session.id,
        wakeOffsetHours,
        weekday: weekdayForDateKey(dateKey),
      },
    ];
  });
}

export function recordsInRange(
  records: readonly SleepNightRecord[],
  range: MetricsRange,
  referenceDate = new Date(),
): SleepNightRecord[] {
  const orderedRecords = sortedByDate(records);
  if (range === 'All') {
    return orderedRecords;
  }

  const referenceDateKey = dateKeyFromDate(referenceDate);
  const startDateKey = addDaysToDateKey(referenceDateKey, -(rangeDayCounts[range] - 1));

  return orderedRecords.filter((record) => record.dateKey >= startDateKey && record.dateKey <= referenceDateKey);
}

export function averageDurationHours(records: readonly SleepNightRecord[]) {
  if (records.length === 0) {
    return null;
  }

  return roundToHundredths(average(records.map((record) => record.durationHours)));
}

export function medianDurationHours(records: readonly SleepNightRecord[]) {
  if (records.length === 0) {
    return null;
  }

  const durations = records.map((record) => record.durationHours).sort((left, right) => left - right);
  const midpoint = Math.floor(durations.length / 2);

  if (durations.length % 2 === 1) {
    return durations[midpoint];
  }

  return roundToHundredths((durations[midpoint - 1] + durations[midpoint]) / 2);
}

export function totalSleepHours(records: readonly SleepNightRecord[]) {
  return roundToHundredths(records.reduce((sum, record) => sum + record.durationHours, 0));
}

export function longestNight(records: readonly SleepNightRecord[]) {
  return records.reduce<SleepNightRecord | null>(
    (longest, record) => (!longest || record.durationHours > longest.durationHours ? record : longest),
    null,
  );
}

export function shortestNight(records: readonly SleepNightRecord[]) {
  return records
    .filter((record) => record.durationHours > 0)
    .reduce<SleepNightRecord | null>(
      (shortest, record) => (!shortest || record.durationHours < shortest.durationHours ? record : shortest),
      null,
    );
}

export function dataRangeDays(records: readonly SleepNightRecord[], referenceDate = new Date()) {
  if (records.length === 0) {
    return 0;
  }

  const orderedRecords = sortedByDate(records);
  const firstDateKey = orderedRecords[0].dateKey;
  const referenceDateKey = dateKeyFromDate(referenceDate);

  return Math.max(1, daysBetweenDateKeys(firstDateKey, referenceDateKey) + 1);
}

export function trackingCoverage(
  records: readonly SleepNightRecord[],
  range: MetricsRange,
  options: TrackingCoverageOptions = {},
) {
  const denominator =
    range === 'All'
      ? dataRangeDays(options.allRecords ?? records, options.referenceDate)
      : Math.max(1, rangeDayCounts[range]);

  if (denominator === 0) {
    return 0;
  }

  return Math.round(Math.min(1, records.length / denominator) * 100);
}

export function goalDurationHours(sleepTargetMinutes: number, wakeTargetMinutes: number) {
  const wrappedWakeTarget = wakeTargetMinutes <= sleepTargetMinutes ? wakeTargetMinutes + 24 * 60 : wakeTargetMinutes;
  return roundToHundredths((wrappedWakeTarget - sleepTargetMinutes) / 60);
}

export function goalHitRate(records: readonly SleepNightRecord[], targetDurationHours: number) {
  if (records.length === 0) {
    return 0;
  }

  const hitCount = records.filter((record) => Math.abs(record.durationHours - targetDurationHours) <= 0.75).length;
  return Math.round((hitCount / records.length) * 100);
}

export function durationTrendPercent(records: readonly SleepNightRecord[], windowSize = 7) {
  if (records.length < windowSize * 2) {
    return null;
  }

  const orderedRecords = sortedByDate(records);
  const currentWindow = orderedRecords.slice(-windowSize);
  const previousWindow = orderedRecords.slice(-windowSize * 2, -windowSize);
  const previousAverage = average(previousWindow.map((record) => record.durationHours));

  if (previousAverage <= 0) {
    return null;
  }

  const currentAverage = average(currentWindow.map((record) => record.durationHours));
  return Math.round(((currentAverage - previousAverage) / previousAverage) * 100);
}

export function movingAverageSeries(records: readonly SleepNightRecord[], windowSize = 7): MovingAveragePoint[] {
  const orderedRecords = sortedByDate(records);
  let rollingTotal = 0;

  return orderedRecords.map((record, index) => {
    rollingTotal += record.durationHours;

    if (index >= windowSize) {
      rollingTotal -= orderedRecords[index - windowSize].durationHours;
    }

    return {
      dateKey: record.dateKey,
      movingAverageHours: index >= windowSize - 1 ? roundToHundredths(rollingTotal / windowSize) : null,
    };
  });
}

export function currentStreak(records: readonly SleepNightRecord[], referenceDate = new Date()) {
  const trackedDateKeys = new Set(records.map((record) => record.dateKey));
  const todayDateKey = dateKeyFromDate(referenceDate);
  const yesterdayDateKey = addDaysToDateKey(todayDateKey, -1);

  let currentDateKey = todayDateKey;
  if (!trackedDateKeys.has(currentDateKey)) {
    if (!trackedDateKeys.has(yesterdayDateKey)) {
      return 0;
    }

    currentDateKey = yesterdayDateKey;
  }

  let streak = 0;
  while (trackedDateKeys.has(currentDateKey)) {
    streak += 1;
    currentDateKey = addDaysToDateKey(currentDateKey, -1);
  }

  return streak;
}

export function longestStreak(records: readonly SleepNightRecord[]) {
  const dateKeys = Array.from(new Set(records.map((record) => record.dateKey))).sort();
  let longest = 0;
  let current = 0;
  let previousDateKey: string | null = null;

  for (const dateKey of dateKeys) {
    current = previousDateKey && daysBetweenDateKeys(previousDateKey, dateKey) === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousDateKey = dateKey;
  }

  return longest;
}
