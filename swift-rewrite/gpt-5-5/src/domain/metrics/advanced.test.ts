import type { SleepNightRecord } from './core';
import {
  alignmentTrendAlpha,
  alignmentScoreWeights,
  consistencyPenaltyPerHour,
  cumulativeDebtHours,
  cumulativeDebtSeries,
  durationBuckets,
  regularityScore,
  rollingConsistencySeries,
  scheduleAccuracyPenaltyPerHour,
  scheduleAccuracyScore,
  sleepAlignmentSeries,
  sleepConsistencyScore,
  socialJetlagHours,
  targetOffsetsFromMinutes,
  wakeConsistencyScore,
  weekdayAverages,
} from './advanced';

function record({
  bedtimeOffsetHours,
  dateKey,
  durationHours,
  wakeOffsetHours,
  weekday,
}: {
  bedtimeOffsetHours: number;
  dateKey: string;
  durationHours: number;
  wakeOffsetHours?: number;
  weekday: number;
}): SleepNightRecord {
  return {
    bedtimeOffsetHours,
    date: new Date(`${dateKey}T12:00:00.000Z`),
    dateKey,
    durationHours,
    midpointOffsetHours: bedtimeOffsetHours + durationHours / 2,
    sessionId: dateKey,
    wakeOffsetHours: wakeOffsetHours ?? bedtimeOffsetHours + durationHours,
    weekday,
  };
}

function sequentialRecords(count: number) {
  return Array.from({ length: count }, (_, index) =>
    record({
      bedtimeOffsetHours: 4 + (index % 3) * 0.5,
      dateKey: `2026-07-${String(index + 1).padStart(2, '0')}`,
      durationHours: 7 + (index % 4) * 0.25,
      weekday: (index % 7) + 1,
    }),
  );
}

describe('advanced sleep metrics', () => {
  it('pins dashboard consistency constants and integer truncation', () => {
    const records = [
      record({ bedtimeOffsetHours: 4, dateKey: '2026-07-13', durationHours: 8, weekday: 2 }),
      record({ bedtimeOffsetHours: 5, dateKey: '2026-07-14', durationHours: 8, weekday: 3 }),
      record({ bedtimeOffsetHours: 6, dateKey: '2026-07-15', durationHours: 8, weekday: 4 }),
    ];

    expect(consistencyPenaltyPerHour).toBe(40);
    expect(sleepConsistencyScore([])).toBe(0);
    expect(sleepConsistencyScore(records)).toBe(68);
    expect(wakeConsistencyScore(records)).toBe(68);
    expect(regularityScore(records)).toBe(68);
  });

  it('calculates schedule accuracy from target bedtime and wake offsets', () => {
    const targets = targetOffsetsFromMinutes(22 * 60, 6 * 60);
    const records = [
      record({ bedtimeOffsetHours: 4, dateKey: '2026-07-13', durationHours: 8, weekday: 2 }),
      record({ bedtimeOffsetHours: 5, dateKey: '2026-07-14', durationHours: 8, weekday: 3 }),
    ];

    expect(scheduleAccuracyPenaltyPerHour).toBe(30);
    expect(targets).toEqual({ targetDurationHours: 8, targetSleepOffsetHours: 4, targetWakeOffsetHours: 12 });
    expect(scheduleAccuracyScore(records, targets)).toBe(85);
    expect(scheduleAccuracyScore([], targets)).toBe(0);
    expect(scheduleAccuracyScore(records, { targetDurationHours: 8 })).toBe(0);
  });

  it('builds rolling 14-day consistency points only after the window is full', () => {
    const records = sequentialRecords(15);
    const points = rollingConsistencySeries(records, targetOffsetsFromMinutes(22 * 60, 6 * 60), 14);

    expect(points[12]).toEqual({
      dateKey: '2026-07-13',
      scheduleAccuracy: null,
      sleepConsistency: null,
      wakeConsistency: null,
    });
    expect(points[13]).toMatchObject({
      dateKey: '2026-07-14',
      scheduleAccuracy: expect.any(Number),
      sleepConsistency: expect.any(Number),
      wakeConsistency: expect.any(Number),
    });
  });

  it('calculates social jetlag with wrapped midpoint difference', () => {
    const records = [
      record({ bedtimeOffsetHours: 4, dateKey: '2026-07-12', durationHours: 8, weekday: 1 }),
      record({ bedtimeOffsetHours: 23, dateKey: '2026-07-13', durationHours: 2, weekday: 2 }),
      record({ bedtimeOffsetHours: 5, dateKey: '2026-07-18', durationHours: 8, weekday: 7 }),
    ];

    expect(socialJetlagHours(records)).toBeCloseTo(8.5, 5);
    expect(socialJetlagHours(records.slice(0, 1))).toBeNull();
  });

  it('calculates cumulative sleep debt and per-night debt series', () => {
    const records = [
      record({ bedtimeOffsetHours: 4, dateKey: '2026-07-13', durationHours: 7, weekday: 2 }),
      record({ bedtimeOffsetHours: 4, dateKey: '2026-07-14', durationHours: 8.5, weekday: 3 }),
      record({ bedtimeOffsetHours: 4, dateKey: '2026-07-15', durationHours: 6, weekday: 4 }),
    ];

    expect(cumulativeDebtHours(records, 8)).toBe(-2.5);
    expect(cumulativeDebtSeries(records, 8).map(({ cumulativeHours }) => cumulativeHours)).toEqual([-1, -0.5, -2.5]);
  });

  it('calculates weekday averages in swift weekday order', () => {
    const records = [
      record({ bedtimeOffsetHours: 4, dateKey: '2026-07-12', durationHours: 6, weekday: 1 }),
      record({ bedtimeOffsetHours: 4, dateKey: '2026-07-13', durationHours: 7, weekday: 2 }),
      record({ bedtimeOffsetHours: 4, dateKey: '2026-07-20', durationHours: 9, weekday: 2 }),
    ];

    expect(weekdayAverages(records).map(({ averageHours, dayName, nights, weekday }) => ({ averageHours, dayName, nights, weekday }))).toEqual([
      { averageHours: 6, dayName: 'Sun', nights: 1, weekday: 1 },
      { averageHours: 8, dayName: 'Mon', nights: 2, weekday: 2 },
      { averageHours: 0, dayName: 'Tue', nights: 0, weekday: 3 },
      { averageHours: 0, dayName: 'Wed', nights: 0, weekday: 4 },
      { averageHours: 0, dayName: 'Thu', nights: 0, weekday: 5 },
      { averageHours: 0, dayName: 'Fri', nights: 0, weekday: 6 },
      { averageHours: 0, dayName: 'Sat', nights: 0, weekday: 7 },
    ]);
  });

  it('buckets durations with exact swift labels and shares', () => {
    const records = [4.9, 5.25, 5.75, 6.25, 6.75, 7.25, 7.75, 8].map((durationHours, index) =>
      record({
        bedtimeOffsetHours: 4,
        dateKey: `2026-07-${String(index + 1).padStart(2, '0')}`,
        durationHours,
        weekday: (index % 7) + 1,
      }),
    );

    expect(durationBuckets([]).map(({ label }) => label)).toEqual([
      '<5h',
      '5-5.5h',
      '5.5-6h',
      '6-6.5h',
      '6.5-7h',
      '7-7.5h',
      '7.5-8h',
      '8h+',
    ]);
    expect(durationBuckets(records)).toEqual([
      { count: 1, label: '<5h', share: 0.125 },
      { count: 1, label: '5-5.5h', share: 0.125 },
      { count: 1, label: '5.5-6h', share: 0.125 },
      { count: 1, label: '6-6.5h', share: 0.125 },
      { count: 1, label: '6.5-7h', share: 0.125 },
      { count: 1, label: '7-7.5h', share: 0.125 },
      { count: 1, label: '7.5-8h', share: 0.125 },
      { count: 1, label: '8h+', share: 0.125 },
    ]);
  });

  it('calculates sleep alignment components with weighted geometric mean and ema trend', () => {
    const targets = targetOffsetsFromMinutes(22 * 60, 6 * 60);
    const records = [
      record({ bedtimeOffsetHours: 4, dateKey: '2026-07-13', durationHours: 8, weekday: 2 }),
      record({ bedtimeOffsetHours: 5, dateKey: '2026-07-14', durationHours: 7, weekday: 3 }),
    ];
    const weightSum = Object.values(alignmentScoreWeights).reduce((sum, value) => sum + value, 0);

    expect(alignmentTrendAlpha).toBe(0.2);
    expect(weightSum).toBeCloseTo(1, 5);
    expect(alignmentScoreWeights).toEqual({
      consistency: 0.15,
      duration: 0.35,
      phase: 0.2,
      timing: 0.3,
    });

    const points = sleepAlignmentSeries(records, targets);
    expect(points[0]).toMatchObject({
      dailyScore: 100,
      durationScore: 1,
      timingScore: 1,
      trendScore: 100,
    });
    expect(points[1].dailyScore).toBeCloseTo(75.088, 3);
    expect(points[1].trendScore).toBeCloseTo(95.018, 3);
    expect(sleepAlignmentSeries(records, { targetDurationHours: 0, targetSleepOffsetHours: 4 })).toEqual([]);
  });
});
