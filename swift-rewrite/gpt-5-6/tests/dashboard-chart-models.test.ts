import {
  createAlignmentChartModel,
  createMovingAverageChartModel,
} from '../src/components/charts/dashboard-chart-models';
import { sleepAlignmentSeries } from '../src/domain/metrics/advanced';
import { movingAverageSeries, type SleepNightRecord } from '../src/domain/metrics/core';

function records(durations: readonly number[]): SleepNightRecord[] {
  return durations.map((durationHours, index) => ({
    bedtimeOffset: 7 + (index % 2) * 0.25,
    date: new Date(2026, 6, index + 1, 12).getTime(),
    dayKey: `2026-07-${String(index + 1).padStart(2, '0')}`,
    durationHours,
    id: `night-${index}`,
    midpointOffset: 7 + durationHours / 2,
    wakeOffset: 7 + durationHours,
    weekday: (index % 7) + 1,
  }));
}

describe('dashboard chart models', () => {
  it('uses the core engine moving averages and splits area segments at target crossings', () => {
    const nights = records([6, 6, 6, 6, 6, 6, 6, 12, 12]);
    const model = createMovingAverageChartModel(nights, 7);
    const engineValues = movingAverageSeries(nights)
      .filter((point) => point.movingAverageHours !== null)
      .map((point) => point.movingAverageHours);

    expect(model.data.map((point) => point.movingAverageHours)).toEqual(engineValues);
    expect(model.segments.map((segment) => segment.band)).toEqual(['below', 'above']);
    expect(model.segments[0].points.at(-1)?.movingAverageHours).toBe(7);
    expect(model.segments[1].points[0].movingAverageHours).toBe(7);
  });

  it('keeps the moving-average domain inside 0-12 with at least a 0.9 hour span', () => {
    const compact = createMovingAverageChartModel(records(Array.from({ length: 8 }, () => 7.1)), 7);
    expect(compact.domain[0]).toBeGreaterThanOrEqual(0);
    expect(compact.domain[1]).toBeLessThanOrEqual(12);
    expect(compact.domain[1] - compact.domain[0]).toBeGreaterThanOrEqual(0.9);

    const bounded = createMovingAverageChartModel(records([0, 0, 0, 0, 0, 0, 0, 12]), 12);
    expect(bounded.domain).toEqual([0, 12]);
  });

  it('passes alignment daily and trend scores through from the advanced engine', () => {
    const nights = records([6.5, 7, 7.5, 8, 7, 6.8, 7.2]);
    const expected = sleepAlignmentSeries(nights, 7, 7);
    const model = createAlignmentChartModel(nights, 7, 7);

    expect(model.map(({ dailyScore, trendScore }) => ({ dailyScore, trendScore }))).toEqual(
      expected.map(({ dailyScore, trendScore }) => ({ dailyScore, trendScore })),
    );
  });

  it('does not invent values for empty ranges', () => {
    expect(createMovingAverageChartModel([], 7).data).toEqual([]);
    expect(createAlignmentChartModel([], 7, 7)).toEqual([]);
  });
});
