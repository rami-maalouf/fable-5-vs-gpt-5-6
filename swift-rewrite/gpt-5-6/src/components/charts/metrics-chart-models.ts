// ports: twilight/views/sleepmetricsview.swift

import { rollingConsistencySeries } from '@/domain/metrics/advanced';
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
