// ports: Utils/SleepMetricsAnalyzer.swift, function for function
// pure ts - no react or expo imports. all Int() casts are Math.trunc to keep
// integer semantics identical to swift.
import { epochFromDayMinutes } from '../editor';
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

export interface ConsistencyPoint {
  date: CalendarDay;
  sleepConsistency: number | null;
  wakeConsistency: number | null;
  scheduleAccuracy: number | null;
}

export interface DebtPoint {
  date: CalendarDay;
  cumulativeHours: number;
}

export interface WeekdayAverage {
  weekday: number;
  dayName: string;
  averageHours: number;
  nights: number;
}

export interface DurationBucket {
  label: string;
  count: number;
  share: number;
}

export interface TrendPeriod {
  days: number;
  averageDuration: number | null;
  previousAverageDuration: number | null;
  changePercent: number | null;
  sparkline: number[];
}

export interface AlignmentScorePoint {
  date: CalendarDay;
  dailyScore: number;
  trendScore: number;
  durationScore: number;
  timingScore: number;
  phaseScore: number;
  consistencyScore: number;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BUCKET_LABELS = ['<5h', '5-5.5h', '5.5-6h', '6-6.5h', '6.5-7h', '7-7.5h', '7.5-8h', '8h+'];

const MINIMUM_INCLUDED_COMPONENT_SCORE = 0.01;

// canonical sessions: valid + completed, one per wake day (longest wins),
// sorted ascending. faithfully to swift, the grouping key is the sleepDate
// INSTANT (startOfDay of the end time in the session's own end timezone), so
// two same-calendar-day nights in different timezones both survive - exactly
// like the original's dictionary keyed by Date.
function sleepDateInstant(session: SleepSession): number {
  return epochFromDayMinutes(wakeDay(session), 0, resolveEndTimeZone(session));
}

function canonicalSessions(sessions: readonly SleepSession[]): SleepSession[] {
  const valid = sessions
    .filter((s) => s.endTime != null && isValidSession(s))
    .sort((a, b) => a.startTime - b.startTime);

  const best = new Map<number, SleepSession>();
  for (const session of valid) {
    const key = sleepDateInstant(session);
    const existing = best.get(key);
    if (!existing || sessionDurationSeconds(session) > sessionDurationSeconds(existing)) {
      best.set(key, session);
    }
  }
  return [...best.values()].sort((a, b) => sleepDateInstant(a) - sleepDateInstant(b));
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

  // -40 points per hour of standard deviation (Int() truncation like swift)
  sleepConsistencyScore(records: readonly SleepNightRecord[]): number {
    return consistencyScoreOf(records.map((r) => r.bedtimeOffset));
  }

  wakeConsistencyScore(records: readonly SleepNightRecord[]): number {
    return consistencyScoreOf(records.map((r) => r.wakeOffset));
  }

  // -30 points per hour of average |deviation| vs the optimal times
  scheduleAccuracyScore(records: readonly SleepNightRecord[]): number {
    if (records.length === 0 || this.targetSleepOffset == null || this.targetWakeOffset == null) {
      return 0;
    }
    const totalDeviation = records.reduce(
      (sum, r) =>
        sum +
        Math.abs(r.bedtimeOffset - this.targetSleepOffset!) +
        Math.abs(r.wakeOffset - this.targetWakeOffset!),
      0
    );
    const averageDeviation = totalDeviation / (records.length * 2);
    return Math.max(0, 100 - Math.trunc(averageDeviation * 30));
  }

  regularityScore(records: readonly SleepNightRecord[]): number {
    const bedtime = this.sleepConsistencyScore(records);
    const wake = this.wakeConsistencyScore(records);
    return Math.trunc((bedtime + wake) / 2);
  }

  // weekend vs weekday sleep midpoint delta (wrapped over 24h)
  socialJetlagHours(records: readonly SleepNightRecord[]): number | null {
    if (records.length === 0) return null;
    const weekends = records.filter((r) => r.weekday === 1 || r.weekday === 7);
    const weekdays = records.filter((r) => r.weekday >= 2 && r.weekday <= 6);
    const weekendMidpoint = average(weekends.map((r) => r.midpointOffset));
    const weekdayMidpoint = average(weekdays.map((r) => r.midpointOffset));
    if (weekendMidpoint == null || weekdayMidpoint == null) return null;
    return wrappedHourDifference(weekendMidpoint, weekdayMidpoint);
  }

  cumulativeDebtHours(records: readonly SleepNightRecord[]): number {
    return records.reduce((sum, r) => sum + (r.durationHours - this.targetDurationHours), 0);
  }

  cumulativeDebtSeries(records: readonly SleepNightRecord[]): DebtPoint[] {
    let running = 0;
    return records.map((r) => {
      running += r.durationHours - this.targetDurationHours;
      return { date: r.date, cumulativeHours: running };
    });
  }

  rollingConsistencySeries(records: readonly SleepNightRecord[], window = 14): ConsistencyPoint[] {
    return records.map((record, index) => {
      if (index + 1 < window) {
        return {
          date: record.date,
          sleepConsistency: null,
          wakeConsistency: null,
          scheduleAccuracy: null,
        };
      }
      const slice = records.slice(index - window + 1, index + 1);
      return {
        date: record.date,
        sleepConsistency: consistencyScoreOf(slice.map((r) => r.bedtimeOffset)),
        wakeConsistency: consistencyScoreOf(slice.map((r) => r.wakeOffset)),
        scheduleAccuracy: this.scheduleAccuracyScore(slice),
      };
    });
  }

  durationTrendsAnalysis(): TrendPeriod[] {
    const periods = [3, 7, 14, 30, 90];
    const dailyValues = this.records.map((r) => r.durationHours);
    const rollingValues = this.movingAverageSeries(this.records, 7)
      .map((p) => p.movingAverageHours)
      .filter((v): v is number => v != null);

    return periods.map((p) => {
      // <= 14 days show raw daily values; longer periods use the smoothed series
      const sparklineSrc = p <= 14 ? dailyValues : rollingValues;
      const sparkline = sparklineSrc.slice(-p);

      const currentPeriod = this.records.slice(-p);
      const previousPeriod = this.records.slice(0, Math.max(0, this.records.length - p)).slice(-p);
      const currentAvg = average(currentPeriod.map((r) => r.durationHours));
      const previousAvg = average(previousPeriod.map((r) => r.durationHours));

      let changePercent: number | null = null;
      if (currentAvg != null && previousAvg != null && previousAvg > 0) {
        changePercent = ((currentAvg - previousAvg) / previousAvg) * 100;
      }

      return {
        days: p,
        averageDuration: currentAvg,
        previousAverageDuration: previousAvg,
        changePercent,
        sparkline,
      };
    });
  }

  weekdayAverages(records: readonly SleepNightRecord[]): WeekdayAverage[] {
    const totals = new Map<number, { duration: number; nights: number }>();
    for (const r of records) {
      const current = totals.get(r.weekday) ?? { duration: 0, nights: 0 };
      totals.set(r.weekday, {
        duration: current.duration + r.durationHours,
        nights: current.nights + 1,
      });
    }
    return Array.from({ length: 7 }, (_, i) => {
      const weekday = i + 1;
      const entry = totals.get(weekday);
      const nights = entry?.nights ?? 0;
      return {
        weekday,
        dayName: WEEKDAY_NAMES[i],
        averageHours: nights > 0 ? (entry?.duration ?? 0) / nights : 0,
        nights,
      };
    });
  }

  durationBuckets(records: readonly SleepNightRecord[]): DurationBucket[] {
    if (records.length === 0) {
      return BUCKET_LABELS.map((label) => ({ label, count: 0, share: 0 }));
    }
    const counts = new Array<number>(BUCKET_LABELS.length).fill(0);
    for (const r of records) {
      const d = r.durationHours;
      if (d < 5) counts[0]++;
      else if (d < 5.5) counts[1]++;
      else if (d < 6) counts[2]++;
      else if (d < 6.5) counts[3]++;
      else if (d < 7) counts[4]++;
      else if (d < 7.5) counts[5]++;
      else if (d < 8) counts[6]++;
      else counts[7]++;
    }
    return BUCKET_LABELS.map((label, index) => ({
      label,
      count: counts[index],
      share: counts[index] / records.length,
    }));
  }

  // weighted geometric mean (duration .35, timing .30, phase .20, consistency
  // .15) with sub-threshold components dropped and weights renormalized, plus
  // an ema trend (0.8 previous + 0.2 daily)
  sleepAlignmentSeries(
    records: readonly SleepNightRecord[],
    consistencyWindow = 14,
    trendAlpha = 0.2,
    maximumScore = 100
  ): AlignmentScorePoint[] {
    if (records.length === 0 || this.targetDurationHours <= 0) return [];
    if (this.targetSleepOffset == null) return [];

    const targetSleepOffset = this.targetSleepOffset;
    const targetMidpoint = targetSleepOffset + this.targetDurationHours / 2;
    const targetWakeOffset = targetSleepOffset + this.targetDurationHours;
    let previousTrendScore: number | null = null;

    return records.map((record, index) => {
      const durationScore = durationAlignmentScore(record.durationHours, this.targetDurationHours);
      const timingScore = timingAlignmentScore(
        record,
        targetSleepOffset,
        targetWakeOffset,
        this.targetDurationHours
      );
      const phaseScore = phaseAlignmentScore(record.midpointOffset, targetMidpoint);
      const windowStart = Math.max(0, index - consistencyWindow + 1);
      const consistencyScore = consistencyAlignmentScore(records.slice(windowStart, index + 1));

      const dailyScore =
        maximumScore *
        extrapolatedAlignmentScore([
          { score: durationScore, weight: 0.35 },
          { score: timingScore, weight: 0.3 },
          { score: phaseScore, weight: 0.2 },
          { score: consistencyScore, weight: 0.15 },
        ]);
      const trendScore =
        previousTrendScore != null
          ? (1 - trendAlpha) * previousTrendScore + trendAlpha * dailyScore
          : dailyScore;
      previousTrendScore = trendScore;

      return {
        date: record.date,
        dailyScore: clamp(dailyScore, 0, maximumScore),
        trendScore: clamp(trendScore, 0, maximumScore),
        durationScore,
        timingScore,
        phaseScore,
        consistencyScore,
      };
    });
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

function consistencyScoreOf(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.max(0, 100 - Math.trunc(standardDeviation(values) * 40));
}

// population standard deviation
function standardDeviation(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function wrappedHourDifference(lhs: number, rhs: number): number {
  const raw = Math.abs(lhs - rhs) % 24;
  return Math.min(raw, 24 - raw);
}

function durationAlignmentScore(actualHours: number, targetHours: number): number {
  const scale = actualHours <= targetHours ? 1.25 : 2.0;
  const deviation = Math.abs(actualHours - targetHours);
  return Math.exp(-((deviation / scale) ** 2));
}

function timingAlignmentScore(
  record: SleepNightRecord,
  targetSleepOffset: number,
  targetWakeOffset: number,
  targetDurationHours: number
): number {
  const actualStart = record.bedtimeOffset;
  const actualEnd = record.bedtimeOffset + record.durationHours;
  const overlapHours = Math.max(
    0,
    Math.min(actualEnd, targetWakeOffset) - Math.max(actualStart, targetSleepOffset)
  );
  const outsideWindowHours = Math.max(0, record.durationHours - overlapHours);
  const overlapScore = overlapHours / Math.max(targetDurationHours, 0.01);
  return clamp(overlapScore - 0.15 * outsideWindowHours, 0, 1);
}

function phaseAlignmentScore(actualMidpoint: number, targetMidpoint: number): number {
  const deviation = wrappedHourDifference(actualMidpoint, targetMidpoint);
  return Math.exp(-0.5 * (deviation / 1.5) ** 2);
}

function consistencyAlignmentScore(records: readonly SleepNightRecord[]): number {
  if (records.length < 2) return 1;
  const midpointStdDev = standardDeviation(records.map((r) => r.midpointOffset));
  const durationStdDev = standardDeviation(records.map((r) => r.durationHours));
  return Math.exp(-0.5 * ((midpointStdDev / 1.25) ** 2 + (durationStdDev / 1.5) ** 2));
}

function extrapolatedAlignmentScore(
  components: readonly { score: number; weight: number }[]
): number {
  const active = components.flatMap((component) => {
    const score = clamp(component.score, 0, 1);
    if (score <= MINIMUM_INCLUDED_COMPONENT_SCORE || component.weight <= 0) return [];
    return [{ score, weight: component.weight }];
  });
  const activeWeight = active.reduce((sum, c) => sum + c.weight, 0);
  if (activeWeight <= 0) return 0;
  return active.reduce((product, c) => product * c.score ** (c.weight / activeWeight), 1);
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.min(Math.max(value, lower), upper);
}
