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
  consistencyScore: number;
  dailyScore: number;
  date: number;
  dayKey: string;
  durationScore: number;
  phaseScore: number;
  timingScore: number;
  trendScore: number;
}

export type AlignmentCardMode = 'score' | 'core';

export interface AlignmentComponentScore {
  id: 'duration' | 'timing' | 'phase' | 'consistency';
  score: number;
  title: string;
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
  mode: AlignmentCardMode = 'score',
): AlignmentChartPoint[] {
  let previousTrendScore: number | null = null;
  return sleepAlignmentSeries(records, targetDurationHours, targetSleepOffset).map((point) => {
    const dailyScore = displayedAlignmentScore(point, mode);
    const trendScore = previousTrendScore === null
      ? dailyScore
      : 0.8 * previousTrendScore + 0.2 * dailyScore;
    previousTrendScore = trendScore;
    return { ...point, dailyScore, trendScore };
  });
}

export function alignmentComponentScores(
  point: AlignmentChartPoint,
  mode: AlignmentCardMode,
): AlignmentComponentScore[] {
  const components: AlignmentComponentScore[] = [
    { id: 'duration', score: point.durationScore, title: 'Duration' },
    { id: 'timing', score: point.timingScore, title: 'Timing' },
    { id: 'phase', score: point.phaseScore, title: 'Phase' },
    { id: 'consistency', score: point.consistencyScore, title: 'Consistency' },
  ];
  return mode === 'score'
    ? components
    : components.filter(({ id }) => id === 'duration' || id === 'consistency');
}

function displayedAlignmentScore(
  point: ReturnType<typeof sleepAlignmentSeries>[number],
  mode: AlignmentCardMode,
): number {
  const components = mode === 'score'
    ? [
        { score: point.durationScore, weight: 0.35 },
        { score: point.timingScore, weight: 0.3 },
        { score: point.phaseScore, weight: 0.2 },
        { score: point.consistencyScore, weight: 0.15 },
      ]
    : [
        { score: point.durationScore, weight: 0.35 },
        { score: point.consistencyScore, weight: 0.15 },
      ];
  const active = components.filter(({ score, weight }) => score > 0.03 && weight > 0);
  const activeWeight = active.reduce((total, component) => total + component.weight, 0);
  if (activeWeight === 0) return 0;
  return 100 * active.reduce(
    (product, component) => product * component.score ** (component.weight / activeWeight),
    1,
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
