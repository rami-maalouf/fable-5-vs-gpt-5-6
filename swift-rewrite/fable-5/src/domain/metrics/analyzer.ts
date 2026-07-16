// ports: Utils/SleepMetricsAnalyzer.swift, function for function
// pure ts - no react or expo imports. all Int() casts are Math.trunc to keep
// integer semantics identical to swift.
import type { CalendarDay, SleepSession } from '../models';
import {
  addDays,
  dayKey,
  diffDays,
  isValidSession,
  resolveEndTimeZone,
  sessionDurationSeconds,
  wakeDay,
  weekdayOf,
} from '../session-rules';
import { timeOffsetFromMinutes, timeOffsetOfInstant } from './chart-data';

export type MetricsRange = '30D' | '90D' | '1Y' | 'All';

export function rangeDays(range: MetricsRange): number | null {
  switch (range) {
    case '30D':
      return 30;
    case '90D':
      return 90;
    case '1Y':
      return 365;
    case 'All':
      return null;
  }
}

export interface SleepNightRecord {
  // the wake day this night belongs to
  date: CalendarDay;
  // 1 = sunday ... 7 = saturday (swift Calendar weekday)
  weekday: number;
  durationHours: number;
  bedtimeOffset: number;
  wakeOffset: number;
  midpointOffset: number;
}

export interface MovingAveragePoint {
  date: CalendarDay;
  durationHours: number;
  movingAverageHours: number | null;
}

const MINIMUM_INCLUDED_COMPONENT_SCORE = 0.01;

// canonical sessions: valid + completed, one per wake day (longest wins),
// sorted by wake day ascending
function canonicalSessions(sessions: readonly SleepSession[]): SleepSession[] {
  const valid = sessions
    .filter((s) => s.endTime != null && isValidSession(s))
    .sort((a, b) => a.startTime - b.startTime);

  const best = new Map<string, SleepSession>();
  for (const session of valid) {
    const key = dayKey(wakeDay(session));
    const existing = best.get(key);
    if (!existing || sessionDurationSeconds(session) > sessionDurationSeconds(existing)) {
      best.set(key, session);
    }
  }
  return [...best.values()].sort((a, b) =>
    dayKey(wakeDay(a)) < dayKey(wakeDay(b)) ? -1 : 1
  );
}

export function buildNightRecords(sessions: readonly SleepSession[]): SleepNightRecord[] {
  return canonicalSessions(sessions).map((session) => {
    const day = wakeDay(session);
    const bedtimeOffset = timeOffsetOfInstant(session.startTime, session.startTimeZone);
    const wakeOffset = timeOffsetOfInstant(session.endTime!, resolveEndTimeZone(session));
    const durationHours = Math.max(0, sessionDurationSeconds(session) / 3600);
    return {
      date: day,
      weekday: weekdayOf(day) + 1,
      durationHours,
      bedtimeOffset,
      wakeOffset,
      midpointOffset: bedtimeOffset + durationHours / 2,
    };
  });
}

export interface AnalyzerOptions {
  // minutes since midnight; null mirrors the swift optionals
  optimalSleepMinutes: number | null;
  optimalWakeMinutes: number | null;
  // "today" for range/streak math (device day in production, fixed in tests)
  today: CalendarDay;
}

export class SleepMetricsAnalyzer {
  readonly records: SleepNightRecord[];
  readonly targetDurationHours: number;
  readonly targetSleepOffset: number | null;
  readonly targetWakeOffset: number | null;
  private readonly today: CalendarDay;

  constructor(sessions: readonly SleepSession[], options: AnalyzerOptions) {
    this.records = buildNightRecords(sessions);
    this.today = options.today;
    this.targetDurationHours = goalDurationHours(
      options.optimalSleepMinutes,
      options.optimalWakeMinutes
    );
    this.targetSleepOffset =
      options.optimalSleepMinutes != null
        ? timeOffsetFromMinutes(options.optimalSleepMinutes)
        : null;
    this.targetWakeOffset =
      options.optimalWakeMinutes != null
        ? timeOffsetFromMinutes(options.optimalWakeMinutes)
        : null;
  }

  get firstTrackedDate(): CalendarDay | null {
    return this.records.length > 0 ? this.records[0].date : null;
  }

  get dataRangeDays(): number {
    const first = this.firstTrackedDate;
    if (!first) return 0;
    return diffDays(first, this.today) + 1;
  }

  recordsIn(range: MetricsRange): SleepNightRecord[] {
    const days = rangeDays(range);
    if (days == null) return this.records;
    const startDay = addDays(this.today, -(days - 1));
    const startKey = dayKey(startDay);
    return this.records.filter((r) => dayKey(r.date) >= startKey);
  }

  averageDuration(records: readonly SleepNightRecord[]): number | null {
    return average(records.map((r) => r.durationHours));
  }

  medianDuration(records: readonly SleepNightRecord[]): number | null {
    const values = records.map((r) => r.durationHours).sort((a, b) => a - b);
    if (values.length === 0) return null;
    if (values.length % 2 === 0) {
      return (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
    }
    return values[Math.trunc(values.length / 2)];
  }

  totalSleepHours(records: readonly SleepNightRecord[]): number {
    return records.reduce((sum, r) => sum + r.durationHours, 0);
  }

  longestNight(records: readonly SleepNightRecord[]): number | null {
    if (records.length === 0) return null;
    return Math.max(...records.map((r) => r.durationHours));
  }

  shortestNight(records: readonly SleepNightRecord[]): number | null {
    const positive = records.map((r) => r.durationHours).filter((d) => d > 0);
    if (positive.length === 0) return null;
    return Math.min(...positive);
  }

  trackingCoverage(records: readonly SleepNightRecord[], range: MetricsRange): number {
    if (records.length === 0) return 0;
    const days = rangeDays(range);
    const denominator = days != null ? Math.max(1, days) : Math.max(1, this.dataRangeDays);
    const ratio = records.length / denominator;
    return Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  }

  goalHitRate(records: readonly SleepNightRecord[], toleranceHours = 0.75): number {
    if (records.length === 0) return 0;
    const hits = records.filter(
      (r) => Math.abs(r.durationHours - this.targetDurationHours) <= toleranceHours
    ).length;
    return Math.round((hits / records.length) * 100);
  }

  durationTrendPercent(records: readonly SleepNightRecord[], window = 7): number | null {
    if (records.length < window * 2) return null;
    const current = records.slice(-window);
    const previous = records.slice(0, records.length - window).slice(-window);
    const currentAvg = average(current.map((r) => r.durationHours));
    const previousAvg = average(previous.map((r) => r.durationHours));
    if (currentAvg == null || previousAvg == null || previousAvg <= 0) return null;
    return ((currentAvg - previousAvg) / previousAvg) * 100;
  }

  movingAverageSeries(records: readonly SleepNightRecord[], window = 7): MovingAveragePoint[] {
    if (records.length === 0) return [];
    const result: MovingAveragePoint[] = [];
    let rollingSum = 0;
    for (let index = 0; index < records.length; index++) {
      rollingSum += records[index].durationHours;
      if (index >= window) {
        rollingSum -= records[index - window].durationHours;
      }
      result.push({
        date: records[index].date,
        durationHours: records[index].durationHours,
        movingAverageHours: index + 1 >= window ? rollingSum / window : null,
      });
    }
    return result;
  }

  currentStreak(): number {
    const tracked = new Set(this.records.map((r) => dayKey(r.date)));
    let currentDay = this.today;
    if (!tracked.has(dayKey(currentDay))) {
      const yesterday = addDays(this.today, -1);
      if (!tracked.has(dayKey(yesterday))) return 0;
      currentDay = yesterday;
    }
    let streak = 0;
    while (tracked.has(dayKey(currentDay))) {
      streak += 1;
      currentDay = addDays(currentDay, -1);
    }
    return streak;
  }

  longestStreak(): number {
    if (this.records.length === 0) return 0;
    const uniqueDates = [...new Set(this.records.map((r) => dayKey(r.date)))]
      .sort()
      .map(parseDayKey);
    let longest = 1;
    let current = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      if (diffDays(uniqueDates[i - 1], uniqueDates[i]) === 1) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }
    return longest;
  }
}

export function goalDurationHours(
  optimalSleepMinutes: number | null,
  optimalWakeMinutes: number | null
): number {
  if (optimalSleepMinutes == null || optimalWakeMinutes == null) return 8;
  const sleepHour = optimalSleepMinutes / 60;
  const wakeHour = optimalWakeMinutes / 60;
  let duration = wakeHour - sleepHour;
  if (duration < 0) duration += 24;
  return duration;
}

function parseDayKey(key: string): CalendarDay {
  const [year, month, day] = key.split('-').map(Number);
  return { year, month, day };
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
