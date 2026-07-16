import {
  METRIC_SCORING,
  cumulativeDebtHours,
  cumulativeDebtSeries,
  durationBuckets,
  regularityScore,
  rollingConsistencySeries,
  scheduleAccuracyScore,
  sleepAlignmentSeries,
  sleepConsistencyScore,
  socialJetlagHours,
  weekdayAverages,
  wakeConsistencyScore,
} from '../src/domain/metrics/advanced';
import type { SleepNightRecord } from '../src/domain/metrics/core';

function record(
  dayKey: string,
  durationHours: number,
  input: Partial<SleepNightRecord> = {},
): SleepNightRecord {
  const bedtimeOffset = input.bedtimeOffset ?? 4;
  return {
    bedtimeOffset,
    date: Date.parse(`${dayKey}T12:00:00.000Z`),
    dayKey,
    durationHours,
    id: input.id ?? dayKey,
    midpointOffset: input.midpointOffset ?? bedtimeOffset + durationHours / 2,
    wakeOffset: input.wakeOffset ?? bedtimeOffset + durationHours,
    weekday: input.weekday ?? new Date(`${dayKey}T12:00:00.000Z`).getUTCDay() + 1,
  };
}

describe('advanced metric constants', () => {
  it('pins every scoring constant and keeps alignment weights normalized', () => {
    expect(METRIC_SCORING).toEqual({
      alignment: {
        consistencyDurationScaleHours: 1.5,
        consistencyMidpointScaleHours: 1.25,
        durationOverScaleHours: 2,
        durationUnderScaleHours: 1.25,
        maximumScore: 100,
        minimumIncludedComponentScore: 0.01,
        phaseScaleHours: 1.5,
        timingOutsidePenaltyPerHour: 0.15,
        trendAlpha: 0.2,
        weights: {
          consistency: 0.15,
          duration: 0.35,
          phase: 0.2,
          timing: 0.3,
        },
      },
      consistencyDeductionPerHour: 40,
      scheduleAccuracyDeductionPerHour: 30,
    });
    expect(Object.values(METRIC_SCORING.alignment.weights).reduce((sum, weight) => sum + weight, 0)).toBe(1);
  });
});

describe('consistency and schedule accuracy', () => {
  const records = [
    record('2026-07-14', 8, { bedtimeOffset: 4, wakeOffset: 12 }),
    record('2026-07-15', 8, { bedtimeOffset: 6, wakeOffset: 14 }),
  ];

  it('deducts 40 points per population standard-deviation hour', () => {
    expect(sleepConsistencyScore(records)).toBe(60);
    expect(wakeConsistencyScore(records)).toBe(60);
    expect(regularityScore(records)).toBe(60);
    expect(sleepConsistencyScore([])).toBe(0);
  });

  it('deducts 30 points per average endpoint-deviation hour', () => {
    expect(scheduleAccuracyScore(records, 4, 12)).toBe(70);
    expect(scheduleAccuracyScore([], 4, 12)).toBe(0);
    expect(scheduleAccuracyScore(records, null, 12)).toBe(0);
  });

  it('emits null rolling values until its complete window', () => {
    const points = rollingConsistencySeries(records, 4, 12, 2);
    expect(points[0]).toMatchObject({
      scheduleAccuracy: null,
      sleepConsistency: null,
      wakeConsistency: null,
    });
    expect(points[1]).toMatchObject({
      scheduleAccuracy: 70,
      sleepConsistency: 60,
      wakeConsistency: 60,
    });
    expect(rollingConsistencySeries([], 4, 12)).toEqual([]);
    const defaultWindow = Array.from({ length: 14 }, (_, index) =>
      record(`2026-07-${String(index + 1).padStart(2, '0')}`, 8),
    );
    const defaultPoints = rollingConsistencySeries(defaultWindow, 4, 12);
    expect(defaultPoints.slice(0, 13).every((point) => point.sleepConsistency === null)).toBe(true);
    expect(defaultPoints[13].sleepConsistency).toBe(100);
  });
});

describe('distribution and debt metrics', () => {
  it('calculates wrapped weekend versus weekday midpoint shift', () => {
    const records = [
      record('2026-07-13', 8, { midpointOffset: 8, weekday: 2 }),
      record('2026-07-18', 8, { midpointOffset: 10, weekday: 7 }),
    ];
    expect(socialJetlagHours(records)).toBe(2);
    expect(socialJetlagHours(records.slice(0, 1))).toBeNull();
    expect(socialJetlagHours([])).toBeNull();
  });

  it('keeps undersleep negative in cumulative debt totals and series', () => {
    const records = [record('2026-07-14', 7), record('2026-07-15', 9)];
    expect(cumulativeDebtHours(records, 8)).toBe(0);
    expect(cumulativeDebtSeries(records, 8).map((point) => point.cumulativeHours)).toEqual([-1, 0]);
    expect(cumulativeDebtHours([], 8)).toBe(0);
  });

  it('returns all weekdays with averages and empty-day zeros', () => {
    const averages = weekdayAverages([
      record('2026-07-12', 8, { weekday: 1 }),
      record('2026-07-19', 10, { weekday: 1 }),
      record('2026-07-13', 7, { weekday: 2 }),
    ]);
    expect(averages).toHaveLength(7);
    expect(averages[0]).toEqual({ averageHours: 9, dayName: 'Sun', nights: 2, weekday: 1 });
    expect(averages[1]).toEqual({ averageHours: 7, dayName: 'Mon', nights: 1, weekday: 2 });
    expect(averages[2]).toEqual({ averageHours: 0, dayName: 'Tue', nights: 0, weekday: 3 });
  });

  it('pins every duration histogram boundary', () => {
    const buckets = durationBuckets(
      [4.9, 5, 5.5, 6, 6.5, 7, 7.5, 8].map((duration, index) =>
        record(`2026-07-${String(index + 1).padStart(2, '0')}`, duration),
      ),
    );
    expect(buckets.map(({ count, share }) => ({ count, share }))).toEqual(
      Array.from({ length: 8 }, () => ({ count: 1, share: 0.125 })),
    );
    expect(durationBuckets([]).every((bucket) => bucket.count === 0 && bucket.share === 0)).toBe(true);
  });
});

describe('sleep alignment score', () => {
  it('returns perfect component, daily, and trend scores for a perfect night', () => {
    const [point] = sleepAlignmentSeries([record('2026-07-16', 8)], 8, 4);
    expect(point).toMatchObject({
      consistencyScore: 1,
      dailyScore: 100,
      durationScore: 1,
      phaseScore: 1,
      timingScore: 1,
      trendScore: 100,
    });
  });

  it('uses the weighted geometric mean and 0.8/0.2 EMA trend', () => {
    const records = [
      record('2026-07-15', 8),
      record('2026-07-16', 7, { bedtimeOffset: 5, midpointOffset: 8.5, wakeOffset: 12 }),
    ];
    const points = sleepAlignmentSeries(records, 8, 4);
    const durationScore = Math.exp(-((1 / 1.25) ** 2));
    const timingScore = 7 / 8;
    const phaseScore = Math.exp(-0.5 * ((0.5 / 1.5) ** 2));
    expect(points[1].durationScore).toBeCloseTo(durationScore);
    expect(points[1].timingScore).toBeCloseTo(timingScore);
    expect(points[1].phaseScore).toBeCloseTo(phaseScore);
    expect(points[1].trendScore).toBeCloseTo(points[0].trendScore * 0.8 + points[1].dailyScore * 0.2);
  });

  it('returns no series without a positive target duration or target bedtime', () => {
    expect(sleepAlignmentSeries([record('2026-07-16', 8)], 0, 4)).toEqual([]);
    expect(sleepAlignmentSeries([record('2026-07-16', 8)], 8, null)).toEqual([]);
    expect(sleepAlignmentSeries([], 8, 4)).toEqual([]);
  });
});
