import {
  alignmentComponentScores,
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

  it('builds the core score from duration and consistency only', () => {
    const nights = records([6.5, 7, 7.5, 8, 7, 6.8, 7.2]);
    const full = createAlignmentChartModel(nights, 7, 7, 'score');
    const core = createAlignmentChartModel(nights, 7, 7, 'core');
    const source = sleepAlignmentSeries(nights, 7, 7)[0];
    const expectedCoreScore = 100
      * source.durationScore ** (0.35 / 0.5)
      * source.consistencyScore ** (0.15 / 0.5);

    expect(core[0].dailyScore).toBeCloseTo(expectedCoreScore);
    expect(core[0].durationScore).toBe(source.durationScore);
    expect(core[0].consistencyScore).toBe(source.consistencyScore);
    expect(core[0].dailyScore).not.toBeCloseTo(full[0].dailyScore);
  });

  it('recomputes the alignment trend with the displayed composite score', () => {
    const nights = records([6.5, 7, 7.5]);
    const model = createAlignmentChartModel(nights, 7, 7, 'core');

    expect(model[1].trendScore).toBeCloseTo(
      0.8 * model[0].trendScore + 0.2 * model[1].dailyScore,
    );
  });

  it('shows all four score components and only the two core components', () => {
    const point = createAlignmentChartModel(records([7]), 7, 7)[0];

    expect(alignmentComponentScores(point, 'score').map((component) => component.id)).toEqual([
      'duration',
      'timing',
      'phase',
      'consistency',
    ]);
    expect(alignmentComponentScores(point, 'core').map((component) => component.id)).toEqual([
      'duration',
      'consistency',
    ]);
  });

  it('does not invent values for empty ranges', () => {
    expect(createMovingAverageChartModel([], 7).data).toEqual([]);
    expect(createAlignmentChartModel([], 7, 7)).toEqual([]);
  });
});
