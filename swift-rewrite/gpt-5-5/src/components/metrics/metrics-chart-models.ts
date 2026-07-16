import type { SleepSettings } from '@/domain/models';
import { movingAverageSeries, type SleepNightRecord } from '@/domain/metrics/core';
import {
  rollingConsistencySeries,
  targetOffsetsFromMinutes,
} from '@/domain/metrics/advanced';

export type DurationMomentumPoint = {
  dateKey: string;
  durationHours: number;
  index: number;
  movingAverageHours: number | null;
  targetHours: number;
  targetMet: boolean;
};

export type RollingConsistencyPoint = {
  dateKey: string;
  index: number;
  scheduleAccuracy: number | null;
  score: number | null;
  sleepConsistency: number | null;
  wakeConsistency: number | null;
};

export type ComponentFilter = 'all' | 'bedtime' | 'wake' | 'accuracy';
export type ComponentSeriesKey = 'sleepConsistency' | 'wakeConsistency' | 'scheduleAccuracy';

export type DurationMomentumModel = {
  domain: [number, number];
  latest: DurationMomentumPoint | null;
  points: DurationMomentumPoint[];
  targetHours: number;
};

export type RollingConsistencyModel = {
  latest: RollingConsistencyPoint | null;
  points: RollingConsistencyPoint[];
};

export type RollingComponentsModel = RollingConsistencyModel & {
  filter: ComponentFilter;
  series: ComponentSeriesKey[];
};

function targetDurationHours(settings: SleepSettings) {
  return targetOffsetsFromMinutes(settings.optimalSleepMinutes, settings.optimalWakeMinutes).targetDurationHours;
}

function roundToHundredths(value: number) {
  return Math.round(value * 100) / 100;
}

function averageNullable(values: readonly (number | null)[]) {
  const present = values.filter((value): value is number => value != null);

  if (present.length === 0) {
    return null;
  }

  return Math.round(present.reduce((sum, value) => sum + value, 0) / present.length);
}

function sortedByDate(records: readonly SleepNightRecord[]) {
  return [...records].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

export function buildDurationMomentumModel(
  records: readonly SleepNightRecord[],
  settings: SleepSettings,
): DurationMomentumModel {
  const orderedRecords = sortedByDate(records);
  const targetHours = targetDurationHours(settings);
  const movingAverages = movingAverageSeries(orderedRecords);
  const points = orderedRecords.map<DurationMomentumPoint>((record, index) => ({
    dateKey: record.dateKey,
    durationHours: record.durationHours,
    index,
    movingAverageHours: movingAverages[index]?.movingAverageHours ?? null,
    targetHours,
    targetMet: record.durationHours >= targetHours,
  }));
  const values = points.flatMap((point) => [
    point.durationHours,
    point.movingAverageHours ?? point.durationHours,
    targetHours,
  ]);
  const min = values.length > 0 ? Math.min(...values) : Math.max(0, targetHours - 1);
  const max = values.length > 0 ? Math.max(...values) : targetHours + 1;

  return {
    domain: [Math.max(0, roundToHundredths(min - 0.75)), roundToHundredths(max + 0.75)],
    latest: points.at(-1) ?? null,
    points,
    targetHours,
  };
}

export function buildRollingConsistencyModel(
  records: readonly SleepNightRecord[],
  settings: SleepSettings,
): RollingConsistencyModel {
  const targets = targetOffsetsFromMinutes(settings.optimalSleepMinutes, settings.optimalWakeMinutes);
  const points = rollingConsistencySeries(sortedByDate(records), targets).map<RollingConsistencyPoint>((point, index) => ({
    dateKey: point.dateKey,
    index,
    scheduleAccuracy: point.scheduleAccuracy,
    score: averageNullable([point.sleepConsistency, point.wakeConsistency, point.scheduleAccuracy]),
    sleepConsistency: point.sleepConsistency,
    wakeConsistency: point.wakeConsistency,
  }));

  return {
    latest: [...points].reverse().find((point) => point.score != null) ?? null,
    points,
  };
}

export function buildRollingComponentsModel(
  records: readonly SleepNightRecord[],
  settings: SleepSettings,
  filter: ComponentFilter,
): RollingComponentsModel {
  const model = buildRollingConsistencyModel(records, settings);
  const series: ComponentSeriesKey[] =
    filter === 'all'
      ? ['sleepConsistency', 'wakeConsistency', 'scheduleAccuracy']
      : filter === 'bedtime'
        ? ['sleepConsistency']
        : filter === 'wake'
          ? ['wakeConsistency']
          : ['scheduleAccuracy'];

  return {
    ...model,
    filter,
    series,
  };
}
