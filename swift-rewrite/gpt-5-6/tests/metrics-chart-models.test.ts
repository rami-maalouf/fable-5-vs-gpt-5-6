import {
  createDebtChartModel,
  createDurationMomentumModel,
  createRegularityChartModel,
  createRegularityComponentSummary,
  createTimingTimelineModel,
  createWeekdayAndHistogramModel,
} from '@/components/charts/metrics-chart-models';
import {
  cumulativeDebtSeries,
  durationBuckets,
  rollingConsistencySeries,
  weekdayAverages,
} from '@/domain/metrics/advanced';
import { movingAverageSeries, type SleepNightRecord } from '@/domain/metrics/core';

function records(count = 16): SleepNightRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const durationHours = 6.25 + (index % 5) * 0.45;
    const bedtimeOffset = 5.5 + (index % 4) * 0.2;
    return {
      bedtimeOffset,
      date: new Date(2026, 6, index + 1, 12).getTime(),
      dayKey: `2026-07-${String(index + 1).padStart(2, '0')}`,
      durationHours,
      id: `night-${index}`,
      midpointOffset: bedtimeOffset + durationHours / 2,
      wakeOffset: bedtimeOffset + durationHours,
      weekday: (index % 7) + 1,
    };
  });
}

describe('metrics chart models', () => {
  it('keeps daily duration bars and the engine seven-night average in one model', () => {
    const nights = records(10);
    const model = createDurationMomentumModel(nights, 7);
    const expectedAverage = movingAverageSeries(nights)
      .filter((point) => point.movingAverageHours !== null)
      .map((point) => point.movingAverageHours);

    expect(model.data).toHaveLength(10);
    expect(model.data.map((point) => point.targetBand)).toContain('below');
    expect(model.data.map((point) => point.targetBand)).toContain('at-or-above');
    expect(model.averageStartIndex).toBe(6);
    expect(model.data.slice(model.averageStartIndex).map((point) => point.rollingAverageHours)).toEqual(expectedAverage);
  });

  it('passes rolling component values through and computes the original composite score', () => {
    const nights = records();
    const targetSleepOffset = 5.5;
    const targetWakeOffset = 12.5;
    const expected = rollingConsistencySeries(nights, targetSleepOffset, targetWakeOffset)
      .filter((point) => point.sleepConsistency !== null && point.wakeConsistency !== null && point.scheduleAccuracy !== null);
    const model = createRegularityChartModel(nights, targetSleepOffset, targetWakeOffset);

    expect(model.data).toHaveLength(expected.length);
    expect(model.data.map((point) => ({
      accuracy: point.accuracy,
      bedtime: point.bedtime,
      wake: point.wake,
    }))).toEqual(expected.map((point) => ({
      accuracy: point.scheduleAccuracy,
      bedtime: point.sleepConsistency,
      wake: point.wakeConsistency,
    })));
    expect(model.data[0].composite).toBe(Math.round(
      (model.data[0].bedtime + model.data[0].wake + model.data[0].accuracy) / 3,
    ));
    expect(model.domain[0]).toBeGreaterThanOrEqual(0);
    expect(model.domain[1]).toBeLessThanOrEqual(100);
    expect(model.domain[1] - model.domain[0]).toBeGreaterThanOrEqual(30);
    expect(createRegularityComponentSummary(model.data)).toEqual({
      accuracy: { average: 86, latest: 86 },
      bedtime: { average: 92, latest: 92 },
      wake: { average: 77, latest: 77 },
    });
  });

  it('does not fabricate rolling values before their engine windows exist', () => {
    expect(createDurationMomentumModel([], 7).data).toEqual([]);
    expect(createRegularityChartModel(records(13), 5.5, 12.5).data).toEqual([]);
  });

  it('keeps debt, weekday, and histogram output anchored to the engine', () => {
    const nights = records();
    const debt = createDebtChartModel(nights, 7);
    const behavior = createWeekdayAndHistogramModel(nights);

    expect(debt.data).toEqual(cumulativeDebtSeries(nights, 7));
    expect(debt.domain[0]).toBeLessThanOrEqual(0);
    expect(debt.domain[1]).toBeGreaterThanOrEqual(0);
    expect(behavior.weekdays).toEqual(weekdayAverages(nights));
    expect(behavior.buckets.map(({ count, label, share }) => ({ count, label, share }))).toEqual(durationBuckets(nights));
    expect(behavior.buckets.every((bucket) => bucket.shareLabel.endsWith('%'))).toBe(true);
  });

  it('builds an overnight-safe timeline domain around actual and target timing', () => {
    const nights = records(3);
    const timeline = createTimingTimelineModel(nights, 4.5, 13.25);

    expect(timeline.points.map((point) => point.dayKey)).toEqual(nights.map((night) => night.dayKey));
    expect(timeline.points.every((point) => point.wakeOffset >= point.bedtimeOffset)).toBe(true);
    expect(timeline.domain[0]).toBeLessThan(4.5);
    expect(timeline.domain[1]).toBeGreaterThan(13.25);
  });
});
