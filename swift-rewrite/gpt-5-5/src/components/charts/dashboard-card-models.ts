import type { SleepSettings } from '@/domain/models';
import {
  goalDurationHours,
  movingAverageSeries,
  type SleepNightRecord,
} from '@/domain/metrics/core';
import { sleepAlignmentSeries, targetOffsetsFromMinutes } from '@/domain/metrics/advanced';

export type MovingAverageChartPoint = {
  dateKey: string;
  index: number;
  movingAverageHours: number;
  vsPriorHours: number | null;
  vsTargetHours: number;
};

export type MovingAverageCardModel = {
  domain: [number, number];
  latest: MovingAverageChartPoint | null;
  points: MovingAverageChartPoint[];
  targetHours: number;
};

export type AlignmentChartPoint = {
  consistencyScore: number;
  dailyScore: number;
  dateKey: string;
  durationScore: number;
  index: number;
  phaseScore: number;
  timingScore: number;
  trendScore: number;
};

export type AlignmentCardModel = {
  bestSevenDayScore: number | null;
  latest: AlignmentChartPoint | null;
  points: AlignmentChartPoint[];
};

function roundToTenths(value: number) {
  return Math.round(value * 10) / 10;
}

function roundScore(value: number) {
  return Math.round(value);
}

function sortedByDate(records: readonly SleepNightRecord[]) {
  return [...records].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

function ensureMinimumSpan(min: number, max: number, minimumSpan: number) {
  if (max - min >= minimumSpan) {
    return [min, max] as [number, number];
  }

  const midpoint = (min + max) / 2;
  return [midpoint - minimumSpan / 2, midpoint + minimumSpan / 2] as [number, number];
}

export function buildMovingAverageCardModel(
  records: readonly SleepNightRecord[],
  settings: SleepSettings,
): MovingAverageCardModel {
  const targetHours = goalDurationHours(settings.optimalSleepMinutes, settings.optimalWakeMinutes);
  const rawPoints = movingAverageSeries(sortedByDate(records), 7)
    .map((point, index, allPoints) => {
      if (point.movingAverageHours == null) {
        return null;
      }

      const priorPoint = allPoints[index - 7];

      return {
        dateKey: point.dateKey,
        index,
        movingAverageHours: point.movingAverageHours,
        vsPriorHours: priorPoint?.movingAverageHours == null ? null : roundToTenths(point.movingAverageHours - priorPoint.movingAverageHours),
        vsTargetHours: roundToTenths(point.movingAverageHours - targetHours),
      };
    })
    .filter((point): point is MovingAverageChartPoint => point != null);
  const values = rawPoints.map((point) => point.movingAverageHours).concat(targetHours);
  const minValue = Math.max(0, Math.min(...values));
  const maxValue = Math.min(12, Math.max(...values));
  const domain = ensureMinimumSpan(minValue, maxValue, 0.9);

  return {
    domain: [Math.max(0, domain[0]), Math.min(12, domain[1])],
    latest: rawPoints.at(-1) ?? null,
    points: rawPoints,
    targetHours,
  };
}

export function buildAlignmentCardModel(
  records: readonly SleepNightRecord[],
  settings: SleepSettings,
): AlignmentCardModel {
  const targets = targetOffsetsFromMinutes(settings.optimalSleepMinutes, settings.optimalWakeMinutes);
  const points = sleepAlignmentSeries(sortedByDate(records), targets).map((point, index) => ({
    consistencyScore: roundScore(point.consistencyScore * 100),
    dailyScore: roundScore(point.dailyScore),
    dateKey: point.dateKey,
    durationScore: roundScore(point.durationScore * 100),
    index,
    phaseScore: roundScore(point.phaseScore * 100),
    timingScore: roundScore(point.timingScore * 100),
    trendScore: roundScore(point.trendScore),
  }));
  const bestSevenDayScore =
    points.length === 0
      ? null
      : Math.max(...points.slice(-7).map((point) => point.dailyScore));

  return {
    bestSevenDayScore,
    latest: points.at(-1) ?? null,
    points,
  };
}

export function formatSignedHours(value: number | null) {
  if (value == null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}h`;
}
