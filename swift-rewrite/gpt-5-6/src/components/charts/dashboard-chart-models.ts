import { sleepAlignmentSeries } from '@/domain/metrics/advanced';
import { movingAverageSeries, type SleepNightRecord } from '@/domain/metrics/core';

const maximumDurationHours = 12;
const minimumDurationDomainSpan = 0.9;
const durationDomainPadding = 0.25;

export interface MovingAverageChartPoint extends Record<string, unknown> {
  date: number;
  dayKey: string;
  movingAverageHours: number;
}

export interface MovingAverageAreaSegment {
  band: 'above' | 'below';
  points: MovingAverageChartPoint[];
}

export interface MovingAverageChartModel {
  data: MovingAverageChartPoint[];
  domain: [number, number];
  segments: MovingAverageAreaSegment[];
}

export interface AlignmentChartPoint extends Record<string, unknown> {
  dailyScore: number;
  date: number;
  dayKey: string;
  trendScore: number;
}

export function createMovingAverageChartModel(
  records: readonly SleepNightRecord[],
  targetDurationHours: number,
): MovingAverageChartModel {
  const data = movingAverageSeries(records)
    .filter(
      (point): point is typeof point & { movingAverageHours: number } => (
        typeof point.movingAverageHours === 'number'
      ),
    )
    .map(({ date, dayKey, movingAverageHours }) => ({ date, dayKey, movingAverageHours }));
  return {
    data,
    domain: durationDomain(data.map((point) => point.movingAverageHours), targetDurationHours),
    segments: splitAtTarget(data, targetDurationHours),
  };
}

export function createAlignmentChartModel(
  records: readonly SleepNightRecord[],
  targetDurationHours: number,
  targetSleepOffset: number | null,
): AlignmentChartPoint[] {
  return sleepAlignmentSeries(records, targetDurationHours, targetSleepOffset).map(
    ({ dailyScore, date, dayKey, trendScore }) => ({ dailyScore, date, dayKey, trendScore }),
  );
}

function durationDomain(values: readonly number[], targetDurationHours: number): [number, number] {
  if (values.length === 0) return [0, maximumDurationHours];
  const minimumValue = Math.min(targetDurationHours, ...values);
  const maximumValue = Math.max(targetDurationHours, ...values);
  let lower = Math.max(0, minimumValue - durationDomainPadding);
  let upper = Math.min(maximumDurationHours, maximumValue + durationDomainPadding);
  if (upper - lower < minimumDurationDomainSpan) {
    const center = (lower + upper) / 2;
    lower = Math.max(0, center - minimumDurationDomainSpan / 2);
    upper = Math.min(maximumDurationHours, lower + minimumDurationDomainSpan);
    lower = Math.max(0, upper - minimumDurationDomainSpan);
  }
  return [lower, upper];
}

function splitAtTarget(
  points: readonly MovingAverageChartPoint[],
  target: number,
): MovingAverageAreaSegment[] {
  const first = points[0];
  if (!first) return [];
  const segments: MovingAverageAreaSegment[] = [];
  let current: MovingAverageAreaSegment = {
    band: first.movingAverageHours >= target ? 'above' : 'below',
    points: [first],
  };
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];
    const nextBand = next.movingAverageHours >= target ? 'above' : 'below';
    if (nextBand === current.band || next.movingAverageHours === target) {
      current.points.push(next);
      continue;
    }
    const progress = (target - previous.movingAverageHours)
      / (next.movingAverageHours - previous.movingAverageHours);
    const crossing: MovingAverageChartPoint = {
      date: previous.date + (next.date - previous.date) * progress,
      dayKey: `${previous.dayKey}/${next.dayKey}`,
      movingAverageHours: target,
    };
    current.points.push(crossing);
    segments.push(current);
    current = { band: nextBand, points: [crossing, next] };
  }
  segments.push(current);
  return segments;
}
