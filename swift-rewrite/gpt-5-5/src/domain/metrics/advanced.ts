// ports: twilight/utils/sleepmetricsanalyzer.swift

import type { SleepNightRecord } from './core';
import { goalDurationHours } from './core';

export type SleepMetricTargets = {
  targetDurationHours: number;
  targetSleepOffsetHours?: number;
  targetWakeOffsetHours?: number;
};

export type SleepConsistencyPoint = {
  dateKey: string;
  scheduleAccuracy: number | null;
  sleepConsistency: number | null;
  wakeConsistency: number | null;
};

export type SleepDebtPoint = {
  cumulativeHours: number;
  dateKey: string;
};

export type SleepWeekdayAverage = {
  averageHours: number;
  dayName: string;
  nights: number;
  weekday: number;
};

export type SleepDurationBucket = {
  count: number;
  label: string;
  share: number;
};

export type SleepAlignmentScorePoint = {
  consistencyScore: number;
  dailyScore: number;
  dateKey: string;
  durationScore: number;
  phaseScore: number;
  timingScore: number;
  trendScore: number;
};

export const consistencyPenaltyPerHour = 40;
export const scheduleAccuracyPenaltyPerHour = 30;
export const alignmentTrendAlpha = 0.2;
export const alignmentScoreWeights = {
  consistency: 0.15,
  duration: 0.35,
  phase: 0.2,
  timing: 0.3,
} as const;

const baseHour = 18;
const maximumScore = 100;
const minimumIncludedComponentScore = 0.01;
const shortWeekdaySymbols = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const durationBucketLabels = ['<5h', '5-5.5h', '5.5-6h', '6-6.5h', '6.5-7h', '7-7.5h', '7.5-8h', '8h+'];

function clockMinutesToOffsetHours(minutes: number) {
  const clockHours = minutes / 60;
  const adjustedHours = clockHours < baseHour ? clockHours + 24 : clockHours;
  return adjustedHours - baseHour;
}

function average(values: readonly number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: readonly number[]) {
  if (values.length < 2) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function consistencyScoreForValues(values: readonly number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.max(0, maximumScore - Math.trunc(standardDeviation(values) * consistencyPenaltyPerHour));
}

function sortedByDate(records: readonly SleepNightRecord[]) {
  return [...records].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

function clamp(value: number, lower: number, upper: number) {
  return Math.min(Math.max(value, lower), upper);
}

function wrappedHourDifference(left: number, right: number) {
  const raw = Math.abs(left - right) % 24;
  return Math.min(raw, 24 - raw);
}

function durationAlignmentScore(actualHours: number, targetHours: number) {
  const scale = actualHours <= targetHours ? 1.25 : 2;
  const deviation = Math.abs(actualHours - targetHours);
  return Math.exp(-((deviation / scale) ** 2));
}

function timingAlignmentScore(record: SleepNightRecord, targets: Required<SleepMetricTargets>) {
  const actualStart = record.bedtimeOffsetHours;
  const actualEnd = record.bedtimeOffsetHours + record.durationHours;
  const overlapHours = Math.max(
    0,
    Math.min(actualEnd, targets.targetWakeOffsetHours) - Math.max(actualStart, targets.targetSleepOffsetHours),
  );
  const outsideWindowHours = Math.max(0, record.durationHours - overlapHours);
  const overlapScore = overlapHours / Math.max(targets.targetDurationHours, 0.01);
  return clamp(overlapScore - 0.15 * outsideWindowHours, 0, 1);
}

function phaseAlignmentScore(actualMidpoint: number, targetMidpoint: number) {
  const deviation = wrappedHourDifference(actualMidpoint, targetMidpoint);
  return Math.exp(-0.5 * (deviation / 1.5) ** 2);
}

function consistencyAlignmentScore(records: readonly SleepNightRecord[]) {
  if (records.length < 2) {
    return 1;
  }

  const midpointStdDev = standardDeviation(records.map((record) => record.midpointOffsetHours));
  const durationStdDev = standardDeviation(records.map((record) => record.durationHours));

  return Math.exp(-0.5 * ((midpointStdDev / 1.25) ** 2 + (durationStdDev / 1.5) ** 2));
}

function extrapolatedAlignmentScore(components: readonly { score: number; weight: number }[]) {
  const activeComponents = components
    .map((component) => ({ score: clamp(component.score, 0, 1), weight: component.weight }))
    .filter((component) => component.score > minimumIncludedComponentScore && component.weight > 0);
  const activeWeight = activeComponents.reduce((sum, component) => sum + component.weight, 0);

  if (activeWeight <= 0) {
    return 0;
  }

  return activeComponents.reduce(
    (product, component) => product * component.score ** (component.weight / activeWeight),
    1,
  );
}

function roundToHundredths(value: number) {
  return Math.round(value * 100) / 100;
}

export function targetOffsetsFromMinutes(sleepTargetMinutes: number, wakeTargetMinutes: number): Required<SleepMetricTargets> {
  return {
    targetDurationHours: goalDurationHours(sleepTargetMinutes, wakeTargetMinutes),
    targetSleepOffsetHours: clockMinutesToOffsetHours(sleepTargetMinutes),
    targetWakeOffsetHours: clockMinutesToOffsetHours(wakeTargetMinutes),
  };
}

export function sleepConsistencyScore(records: readonly SleepNightRecord[]) {
  return consistencyScoreForValues(records.map((record) => record.bedtimeOffsetHours));
}

export function wakeConsistencyScore(records: readonly SleepNightRecord[]) {
  return consistencyScoreForValues(records.map((record) => record.wakeOffsetHours));
}

export function regularityScore(records: readonly SleepNightRecord[]) {
  return Math.trunc((sleepConsistencyScore(records) + wakeConsistencyScore(records)) / 2);
}

export function scheduleAccuracyScore(records: readonly SleepNightRecord[], targets: SleepMetricTargets) {
  if (
    records.length === 0 ||
    targets.targetSleepOffsetHours == null ||
    targets.targetWakeOffsetHours == null
  ) {
    return 0;
  }

  const totalDeviation = records.reduce(
    (sum, record) =>
      sum +
      Math.abs(record.bedtimeOffsetHours - targets.targetSleepOffsetHours!) +
      Math.abs(record.wakeOffsetHours - targets.targetWakeOffsetHours!),
    0,
  );
  const averageDeviation = totalDeviation / (records.length * 2);

  return Math.max(0, maximumScore - Math.trunc(averageDeviation * scheduleAccuracyPenaltyPerHour));
}

export function rollingConsistencySeries(
  records: readonly SleepNightRecord[],
  targets: SleepMetricTargets,
  windowSize = 14,
): SleepConsistencyPoint[] {
  const orderedRecords = sortedByDate(records);

  return orderedRecords.map((record, index) => {
    if (index + 1 < windowSize) {
      return {
        dateKey: record.dateKey,
        scheduleAccuracy: null,
        sleepConsistency: null,
        wakeConsistency: null,
      };
    }

    const slice = orderedRecords.slice(index - windowSize + 1, index + 1);
    return {
      dateKey: record.dateKey,
      scheduleAccuracy: scheduleAccuracyScore(slice, targets),
      sleepConsistency: sleepConsistencyScore(slice),
      wakeConsistency: wakeConsistencyScore(slice),
    };
  });
}

export function socialJetlagHours(records: readonly SleepNightRecord[]) {
  if (records.length === 0) {
    return null;
  }

  const weekends = records.filter((record) => record.weekday === 1 || record.weekday === 7);
  const weekdays = records.filter((record) => record.weekday >= 2 && record.weekday <= 6);

  if (weekends.length === 0 || weekdays.length === 0) {
    return null;
  }

  return wrappedHourDifference(
    average(weekends.map((record) => record.midpointOffsetHours)),
    average(weekdays.map((record) => record.midpointOffsetHours)),
  );
}

export function cumulativeDebtHours(records: readonly SleepNightRecord[], targetDurationHours: number) {
  return roundToHundredths(records.reduce((sum, record) => sum + (record.durationHours - targetDurationHours), 0));
}

export function cumulativeDebtSeries(records: readonly SleepNightRecord[], targetDurationHours: number): SleepDebtPoint[] {
  let runningHours = 0;

  return sortedByDate(records).map((record) => {
    runningHours += record.durationHours - targetDurationHours;
    return {
      cumulativeHours: roundToHundredths(runningHours),
      dateKey: record.dateKey,
    };
  });
}

export function weekdayAverages(records: readonly SleepNightRecord[]): SleepWeekdayAverage[] {
  const totals = new Map<number, { durationHours: number; nights: number }>();

  for (const record of records) {
    const current = totals.get(record.weekday) ?? { durationHours: 0, nights: 0 };
    totals.set(record.weekday, {
      durationHours: current.durationHours + record.durationHours,
      nights: current.nights + 1,
    });
  }

  return shortWeekdaySymbols.map((dayName, index) => {
    const weekday = index + 1;
    const entry = totals.get(weekday);
    const nights = entry?.nights ?? 0;

    return {
      averageHours: nights > 0 ? roundToHundredths((entry?.durationHours ?? 0) / nights) : 0,
      dayName,
      nights,
      weekday,
    };
  });
}

export function durationBuckets(records: readonly SleepNightRecord[]): SleepDurationBucket[] {
  const counts = Array.from({ length: durationBucketLabels.length }, () => 0);

  for (const record of records) {
    const duration = record.durationHours;

    if (duration < 5) {
      counts[0] += 1;
    } else if (duration < 5.5) {
      counts[1] += 1;
    } else if (duration < 6) {
      counts[2] += 1;
    } else if (duration < 6.5) {
      counts[3] += 1;
    } else if (duration < 7) {
      counts[4] += 1;
    } else if (duration < 7.5) {
      counts[5] += 1;
    } else if (duration < 8) {
      counts[6] += 1;
    } else {
      counts[7] += 1;
    }
  }

  return durationBucketLabels.map((label, index) => ({
    count: counts[index],
    label,
    share: records.length > 0 ? counts[index] / records.length : 0,
  }));
}

export function sleepAlignmentSeries(
  records: readonly SleepNightRecord[],
  targets: SleepMetricTargets,
  consistencyWindow = 14,
): SleepAlignmentScorePoint[] {
  if (records.length === 0 || targets.targetDurationHours <= 0 || targets.targetSleepOffsetHours == null) {
    return [];
  }

  const orderedRecords = sortedByDate(records);
  const requiredTargets: Required<SleepMetricTargets> = {
    targetDurationHours: targets.targetDurationHours,
    targetSleepOffsetHours: targets.targetSleepOffsetHours,
    targetWakeOffsetHours: targets.targetSleepOffsetHours + targets.targetDurationHours,
  };
  const targetMidpoint = requiredTargets.targetSleepOffsetHours + requiredTargets.targetDurationHours / 2;
  let previousTrendScore: number | null = null;

  return orderedRecords.map((record, index) => {
    const durationScore = durationAlignmentScore(record.durationHours, requiredTargets.targetDurationHours);
    const timingScore = timingAlignmentScore(record, requiredTargets);
    const phaseScore = phaseAlignmentScore(record.midpointOffsetHours, targetMidpoint);
    const windowStart = Math.max(0, index - consistencyWindow + 1);
    const consistencyScore = consistencyAlignmentScore(orderedRecords.slice(windowStart, index + 1));
    const dailyScore =
      maximumScore *
      extrapolatedAlignmentScore([
        { score: durationScore, weight: alignmentScoreWeights.duration },
        { score: timingScore, weight: alignmentScoreWeights.timing },
        { score: phaseScore, weight: alignmentScoreWeights.phase },
        { score: consistencyScore, weight: alignmentScoreWeights.consistency },
      ]);
    const trendScore =
      previousTrendScore == null
        ? dailyScore
        : (1 - alignmentTrendAlpha) * previousTrendScore + alignmentTrendAlpha * dailyScore;

    previousTrendScore = trendScore;

    return {
      consistencyScore,
      dailyScore: clamp(dailyScore, 0, maximumScore),
      dateKey: record.dateKey,
      durationScore,
      phaseScore,
      timingScore,
      trendScore: clamp(trendScore, 0, maximumScore),
    };
  });
}
