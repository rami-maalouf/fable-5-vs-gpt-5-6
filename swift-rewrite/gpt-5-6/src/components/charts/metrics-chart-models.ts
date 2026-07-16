// ports: twilight/views/sleepmetricsview.swift

import {
  cumulativeDebtSeries,
  durationBuckets,
  rollingConsistencySeries,
  weekdayAverages,
  type SleepDurationBucket,
  type SleepWeekdayAverage,
} from '@/domain/metrics/advanced';
import { movingAverageSeries, type SleepNightRecord } from '@/domain/metrics/core';

export interface DurationMomentumPoint extends Record<string, unknown> {
  date: number;
  dayKey: string;
  durationHours: number;
  rollingAverageHours: number;
  targetBand: 'at-or-above' | 'below';
}

export interface DurationMomentumModel {
  averageStartIndex: number;
  data: DurationMomentumPoint[];
}

export interface RegularityChartPoint extends Record<string, unknown> {
  accuracy: number;
  bedtime: number;
  composite: number;
  date: number;
  dayKey: string;
  wake: number;
}

export interface RegularityChartModel {
  data: RegularityChartPoint[];
  domain: [number, number];
}

export interface DebtChartModel {
  data: DebtChartPoint[];
  domain: [number, number];
}

export interface DebtChartPoint extends Record<string, unknown> {
  cumulativeHours: number;
  date: number;
  dayKey: string;
}

export interface BehaviorChartModel {
  buckets: (SleepDurationBucket & { shareLabel: string })[];
  weekdays: SleepWeekdayAverage[];
}

export interface TimingTimelinePoint {
  bedtimeOffset: number;
  date: number;
  dayKey: string;
  wakeOffset: number;
}

export interface TimingTimelineModel {
  domain: [number, number];
  points: TimingTimelinePoint[];
  targetSleepOffset: number;
  targetWakeOffset: number;
}

export function createDurationMomentumModel(
  records: readonly SleepNightRecord[],
  targetDurationHours: number,
): DurationMomentumModel {
  const series = movingAverageSeries(records);
  const averageStartIndex = series.findIndex((point) => point.movingAverageHours !== null);
  return {
    averageStartIndex: averageStartIndex < 0 ? series.length : averageStartIndex,
    data: series.map((point) => ({
      date: point.date,
      dayKey: point.dayKey,
      durationHours: point.durationHours,
      rollingAverageHours: point.movingAverageHours ?? 0,
      targetBand: point.durationHours >= targetDurationHours ? 'at-or-above' : 'below',
    })),
  };
}

export function createRegularityChartModel(
  records: readonly SleepNightRecord[],
  targetSleepOffset: number | null,
  targetWakeOffset: number | null,
): RegularityChartModel {
  const data = rollingConsistencySeries(records, targetSleepOffset, targetWakeOffset)
    .flatMap((point): RegularityChartPoint[] => {
      if (
        point.sleepConsistency === null
        || point.wakeConsistency === null
        || point.scheduleAccuracy === null
      ) {
        return [];
      }
      return [{
        accuracy: point.scheduleAccuracy,
        bedtime: point.sleepConsistency,
        composite: Math.round(
          (point.sleepConsistency + point.wakeConsistency + point.scheduleAccuracy) / 3,
        ),
        date: point.date,
        dayKey: point.dayKey,
        wake: point.wakeConsistency,
      }];
    });
  return { data, domain: regularityDomain(data) };
}

export function createDebtChartModel(
  records: readonly SleepNightRecord[],
  targetDurationHours: number,
): DebtChartModel {
  const data = cumulativeDebtSeries(records, targetDurationHours).map((point) => ({ ...point }));
  const values = [0, ...data.map((point) => point.cumulativeHours)];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max(1, (maximum - minimum) * 0.12);
  return { data, domain: [minimum - padding, maximum + padding] };
}

export function createWeekdayAndHistogramModel(
  records: readonly SleepNightRecord[],
): BehaviorChartModel {
  return {
    buckets: durationBuckets(records).map((bucket) => ({
      ...bucket,
      shareLabel: `${Math.round(bucket.share * 100)}%`,
    })),
    weekdays: weekdayAverages(records),
  };
}

export function createTimingTimelineModel(
  records: readonly SleepNightRecord[],
  targetSleepOffset: number,
  targetWakeOffset: number,
): TimingTimelineModel {
  const normalizedTargetWake = targetWakeOffset < targetSleepOffset
    ? targetWakeOffset + 24
    : targetWakeOffset;
  const points = records.map((record) => ({
    bedtimeOffset: record.bedtimeOffset,
    date: record.date,
    dayKey: record.dayKey,
    wakeOffset: record.wakeOffset < record.bedtimeOffset
      ? record.wakeOffset + 24
      : record.wakeOffset,
  }));
  const values = [
    targetSleepOffset,
    normalizedTargetWake,
    ...points.flatMap((point) => [point.bedtimeOffset, point.wakeOffset]),
  ];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max(0.4, (maximum - minimum) * 0.12);
  return {
    domain: [minimum - padding, maximum + padding],
    points,
    targetSleepOffset,
    targetWakeOffset: normalizedTargetWake,
  };
}

function regularityDomain(data: readonly RegularityChartPoint[]): [number, number] {
  if (data.length === 0) {
    return [0, 100];
  }
  const values = data.flatMap((point) => [point.accuracy, point.bedtime, point.composite, point.wake, 80]);
  let lower = Math.max(0, Math.floor(Math.min(...values) / 10) * 10 - 10);
  let upper = Math.min(100, Math.ceil(Math.max(...values) / 10) * 10 + 10);
  if (upper - lower < 30) {
    const midpoint = (lower + upper) / 2;
    lower = Math.max(0, midpoint - 15);
    upper = Math.min(100, midpoint + 15);
  }
  if (upper - lower < 30) {
    lower = Math.max(0, upper - 30);
    upper = Math.min(100, lower + 30);
  }
  return [lower, upper];
}
