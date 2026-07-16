import type { SleepNightRecord } from '@/domain/metrics/core';

const alignmentWeights = Object.freeze({
  consistency: 0.15,
  duration: 0.35,
  phase: 0.2,
  timing: 0.3,
});

const alignmentScoring = Object.freeze({
  consistencyDurationScaleHours: 1.5,
  consistencyMidpointScaleHours: 1.25,
  durationOverScaleHours: 2,
  durationUnderScaleHours: 1.25,
  maximumScore: 100,
  minimumIncludedComponentScore: 0.01,
  phaseScaleHours: 1.5,
  timingOutsidePenaltyPerHour: 0.15,
  trendAlpha: 0.2,
  weights: alignmentWeights,
});

export const METRIC_SCORING = Object.freeze({
  alignment: alignmentScoring,
  consistencyDeductionPerHour: 40,
  scheduleAccuracyDeductionPerHour: 30,
});

export interface SleepConsistencyPoint {
  date: number;
  dayKey: string;
  scheduleAccuracy: number | null;
  sleepConsistency: number | null;
  wakeConsistency: number | null;
}

export interface SleepDebtPoint {
  cumulativeHours: number;
  date: number;
  dayKey: string;
}

export interface SleepWeekdayAverage {
  averageHours: number;
  dayName: string;
  nights: number;
  weekday: number;
}

export interface SleepDurationBucket {
  count: number;
  label: string;
  share: number;
}

export interface SleepAlignmentScorePoint {
  consistencyScore: number;
  dailyScore: number;
  date: number;
  dayKey: string;
  durationScore: number;
  phaseScore: number;
  timingScore: number;
  trendScore: number;
}

interface AlignmentOptions {
  consistencyWindow?: number;
  maximumScore?: number;
  trendAlpha?: number;
}

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const durationBucketLabels = ['<5h', '5-5.5h', '5.5-6h', '6-6.5h', '6.5-7h', '7-7.5h', '7.5-8h', '8h+'];

export function sleepConsistencyScore(records: readonly SleepNightRecord[]): number {
  return consistencyScore(records.map((record) => record.bedtimeOffset));
}

export function wakeConsistencyScore(records: readonly SleepNightRecord[]): number {
  return consistencyScore(records.map((record) => record.wakeOffset));
}

export function regularityScore(records: readonly SleepNightRecord[]): number {
  return Math.trunc((sleepConsistencyScore(records) + wakeConsistencyScore(records)) / 2);
}

export function scheduleAccuracyScore(
  records: readonly SleepNightRecord[],
  targetSleepOffset: number | null,
  targetWakeOffset: number | null,
): number {
  if (records.length === 0 || targetSleepOffset === null || targetWakeOffset === null) {
    return 0;
  }
  const totalDeviation = records.reduce(
    (total, record) =>
      total
      + Math.abs(record.bedtimeOffset - targetSleepOffset)
      + Math.abs(record.wakeOffset - targetWakeOffset),
    0,
  );
  const averageDeviation = totalDeviation / (records.length * 2);
  return Math.max(
    0,
    100 - Math.trunc(averageDeviation * METRIC_SCORING.scheduleAccuracyDeductionPerHour),
  );
}

export function rollingConsistencySeries(
  records: readonly SleepNightRecord[],
  targetSleepOffset: number | null,
  targetWakeOffset: number | null,
  window = 14,
): SleepConsistencyPoint[] {
  assertPositiveWindow(window);
  return records.map((record, index) => {
    if (index + 1 < window) {
      return {
        date: record.date,
        dayKey: record.dayKey,
        scheduleAccuracy: null,
        sleepConsistency: null,
        wakeConsistency: null,
      };
    }
    const slice = records.slice(index - window + 1, index + 1);
    return {
      date: record.date,
      dayKey: record.dayKey,
      scheduleAccuracy: scheduleAccuracyScore(slice, targetSleepOffset, targetWakeOffset),
      sleepConsistency: sleepConsistencyScore(slice),
      wakeConsistency: wakeConsistencyScore(slice),
    };
  });
}

export function socialJetlagHours(records: readonly SleepNightRecord[]): number | null {
  const weekendMidpoint = average(
    records
      .filter((record) => record.weekday === 1 || record.weekday === 7)
      .map((record) => record.midpointOffset),
  );
  const weekdayMidpoint = average(
    records
      .filter((record) => record.weekday >= 2 && record.weekday <= 6)
      .map((record) => record.midpointOffset),
  );
  return weekendMidpoint === null || weekdayMidpoint === null
    ? null
    : wrappedHourDifference(weekendMidpoint, weekdayMidpoint);
}

export function cumulativeDebtHours(
  records: readonly SleepNightRecord[],
  targetDurationHours: number,
): number {
  return records.reduce(
    (total, record) => total + record.durationHours - targetDurationHours,
    0,
  );
}

export function cumulativeDebtSeries(
  records: readonly SleepNightRecord[],
  targetDurationHours: number,
): SleepDebtPoint[] {
  let cumulativeHours = 0;
  return records.map((record) => {
    cumulativeHours += record.durationHours - targetDurationHours;
    return { cumulativeHours, date: record.date, dayKey: record.dayKey };
  });
}

export function weekdayAverages(
  records: readonly SleepNightRecord[],
): SleepWeekdayAverage[] {
  const totals = new Map<number, { duration: number; nights: number }>();
  for (const record of records) {
    const current = totals.get(record.weekday) ?? { duration: 0, nights: 0 };
    totals.set(record.weekday, {
      duration: current.duration + record.durationHours,
      nights: current.nights + 1,
    });
  }
  return weekdayNames.map((dayName, index) => {
    const weekday = index + 1;
    const entry = totals.get(weekday);
    const nights = entry?.nights ?? 0;
    return {
      averageHours: nights > 0 ? (entry?.duration ?? 0) / nights : 0,
      dayName,
      nights,
      weekday,
    };
  });
}

export function durationBuckets(
  records: readonly SleepNightRecord[],
): SleepDurationBucket[] {
  const counts = Array.from({ length: durationBucketLabels.length }, () => 0);
  for (const record of records) {
    counts[durationBucketIndex(record.durationHours)] += 1;
  }
  return durationBucketLabels.map((label, index) => ({
    count: counts[index],
    label,
    share: records.length === 0 ? 0 : counts[index] / records.length,
  }));
}

export function sleepAlignmentSeries(
  records: readonly SleepNightRecord[],
  targetDurationHours: number,
  targetSleepOffset: number | null,
  options: AlignmentOptions = {},
): SleepAlignmentScorePoint[] {
  if (records.length === 0 || targetDurationHours <= 0 || targetSleepOffset === null) {
    return [];
  }
  const consistencyWindow = options.consistencyWindow ?? 14;
  const trendAlpha = options.trendAlpha ?? METRIC_SCORING.alignment.trendAlpha;
  const maximumScore = options.maximumScore ?? METRIC_SCORING.alignment.maximumScore;
  assertPositiveWindow(consistencyWindow);
  const targetMidpoint = targetSleepOffset + targetDurationHours / 2;
  const targetWakeOffset = targetSleepOffset + targetDurationHours;
  let previousTrendScore: number | null = null;

  return records.map((record, index) => {
    const durationScore = durationAlignmentScore(record.durationHours, targetDurationHours);
    const timingScore = timingAlignmentScore(
      record,
      targetDurationHours,
      targetSleepOffset,
      targetWakeOffset,
    );
    const phaseScore = phaseAlignmentScore(record.midpointOffset, targetMidpoint);
    const windowStart = Math.max(0, index - consistencyWindow + 1);
    const consistencyScore = consistencyAlignmentScore(records.slice(windowStart, index + 1));
    const dailyScore = maximumScore * extrapolatedAlignmentScore([
      { score: durationScore, weight: METRIC_SCORING.alignment.weights.duration },
      { score: timingScore, weight: METRIC_SCORING.alignment.weights.timing },
      { score: phaseScore, weight: METRIC_SCORING.alignment.weights.phase },
      { score: consistencyScore, weight: METRIC_SCORING.alignment.weights.consistency },
    ]);
    const trendScore = previousTrendScore === null
      ? dailyScore
      : (1 - trendAlpha) * previousTrendScore + trendAlpha * dailyScore;
    previousTrendScore = trendScore;
    return {
      consistencyScore,
      dailyScore: clamp(dailyScore, 0, maximumScore),
      date: record.date,
      dayKey: record.dayKey,
      durationScore,
      phaseScore,
      timingScore,
      trendScore: clamp(trendScore, 0, maximumScore),
    };
  });
}

function consistencyScore(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const standardDeviationHours = standardDeviation(values);
  return Math.max(
    0,
    100 - Math.trunc(standardDeviationHours * METRIC_SCORING.consistencyDeductionPerHour),
  );
}

function durationBucketIndex(durationHours: number): number {
  if (durationHours < 5) return 0;
  if (durationHours < 5.5) return 1;
  if (durationHours < 6) return 2;
  if (durationHours < 6.5) return 3;
  if (durationHours < 7) return 4;
  if (durationHours < 7.5) return 5;
  if (durationHours < 8) return 6;
  return 7;
}

function durationAlignmentScore(actualHours: number, targetHours: number): number {
  const scale = actualHours <= targetHours
    ? METRIC_SCORING.alignment.durationUnderScaleHours
    : METRIC_SCORING.alignment.durationOverScaleHours;
  return Math.exp(-((Math.abs(actualHours - targetHours) / scale) ** 2));
}

function timingAlignmentScore(
  record: SleepNightRecord,
  targetDurationHours: number,
  targetSleepOffset: number,
  targetWakeOffset: number,
): number {
  const actualEnd = record.bedtimeOffset + record.durationHours;
  const overlapHours = Math.max(
    0,
    Math.min(actualEnd, targetWakeOffset) - Math.max(record.bedtimeOffset, targetSleepOffset),
  );
  const outsideWindowHours = Math.max(0, record.durationHours - overlapHours);
  const overlapScore = overlapHours / Math.max(targetDurationHours, 0.01);
  return clamp(
    overlapScore - METRIC_SCORING.alignment.timingOutsidePenaltyPerHour * outsideWindowHours,
    0,
    1,
  );
}

function phaseAlignmentScore(actualMidpoint: number, targetMidpoint: number): number {
  const deviation = wrappedHourDifference(actualMidpoint, targetMidpoint);
  return Math.exp(-0.5 * ((deviation / METRIC_SCORING.alignment.phaseScaleHours) ** 2));
}

function consistencyAlignmentScore(records: readonly SleepNightRecord[]): number {
  if (records.length < 2) {
    return 1;
  }
  const midpointDeviation = standardDeviation(records.map((record) => record.midpointOffset));
  const durationDeviation = standardDeviation(records.map((record) => record.durationHours));
  return Math.exp(
    -0.5
    * (
      (midpointDeviation / METRIC_SCORING.alignment.consistencyMidpointScaleHours) ** 2
      + (durationDeviation / METRIC_SCORING.alignment.consistencyDurationScaleHours) ** 2
    ),
  );
}

function extrapolatedAlignmentScore(
  components: readonly { score: number; weight: number }[],
): number {
  const active = components
    .map(({ score, weight }) => ({ score: clamp(score, 0, 1), weight }))
    .filter(
      ({ score, weight }) =>
        score > METRIC_SCORING.alignment.minimumIncludedComponentScore && weight > 0,
    );
  const activeWeight = active.reduce((total, component) => total + component.weight, 0);
  if (activeWeight <= 0) {
    return 0;
  }
  return active.reduce(
    (product, component) => product * component.score ** (component.weight / activeWeight),
    1,
  );
}

function standardDeviation(values: readonly number[]): number {
  if (values.length < 2) {
    return 0;
  }
  const meanValue = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values.reduce((total, value) => total + (value - meanValue) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function average(values: readonly number[]): number | null {
  return values.length === 0
    ? null
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function wrappedHourDifference(left: number, right: number): number {
  const raw = Math.abs(left - right) % 24;
  return Math.min(raw, 24 - raw);
}

function assertPositiveWindow(value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Window must be a positive integer: ${value}`);
  }
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.min(Math.max(value, lower), upper);
}
