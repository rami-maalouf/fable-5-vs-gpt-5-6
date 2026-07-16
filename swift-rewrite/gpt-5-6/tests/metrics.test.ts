import type { SleepSession } from '../src/domain/models';
import {
  averageDuration,
  createNightRecords,
  currentStreak,
  durationTrendPercent,
  goalDurationHours,
  goalHitRate,
  longestNight,
  longestStreak,
  medianDuration,
  movingAverageSeries,
  recordsInRange,
  shortestNight,
  totalSleepHours,
  trackingCoverage,
  type SleepNightRecord,
} from '../src/domain/metrics/core';

function record(dayKey: string, durationHours: number): SleepNightRecord {
  return {
    bedtimeOffset: 4,
    date: Date.parse(`${dayKey}T12:00:00.000Z`),
    dayKey,
    durationHours,
    id: dayKey,
    midpointOffset: 4 + durationHours / 2,
    wakeOffset: 4 + durationHours,
    weekday: new Date(`${dayKey}T12:00:00.000Z`).getUTCDay() + 1,
  };
}

function session(input: Partial<SleepSession> & Pick<SleepSession, 'id' | 'startTime' | 'endTime'>): SleepSession {
  return {
    createdAt: 1,
    endTimeZone: 'America/Edmonton',
    startTimeZone: 'America/Edmonton',
    tag: 'Sleep',
    updatedAt: 1,
    ...input,
  };
}

describe('metrics night records', () => {
  it('uses the wake day and 18:00-base offsets in each endpoint timezone', () => {
    const records = createNightRecords([
      session({
        endTime: Date.parse('2026-07-16T13:00:00.000Z'),
        id: 'night',
        startTime: Date.parse('2026-07-16T05:30:00.000Z'),
      }),
    ]);

    expect(records).toEqual([
      expect.objectContaining({
        bedtimeOffset: 5.5,
        dayKey: '2026-07-16',
        durationHours: 7.5,
        midpointOffset: 9.25,
        wakeOffset: 13,
        weekday: 5,
      }),
    ]);
  });

  it('keeps the longest valid session per wake day and drops active or noisy sessions', () => {
    const commonEnd = Date.parse('2026-07-16T13:00:00.000Z');
    const records = createNightRecords([
      session({ endTime: commonEnd, id: 'short', startTime: commonEnd - 6 * 3_600_000 }),
      session({ endTime: commonEnd, id: 'long', startTime: commonEnd - 8 * 3_600_000 }),
      session({ endTime: commonEnd + 86_400_000, id: 'noise', startTime: commonEnd + 86_200_001 }),
      session({ endTime: null, id: 'active', startTime: commonEnd }),
    ]);

    expect(records.map(({ durationHours, id }) => ({ durationHours, id }))).toEqual([
      { durationHours: 8, id: 'long' },
    ]);
  });
});

describe('metrics summaries', () => {
  const records = [record('2026-07-14', 6), record('2026-07-15', 8), record('2026-07-16', 10)];

  it('calculates duration summaries and source-compatible empty values', () => {
    expect(averageDuration(records)).toBe(8);
    expect(medianDuration(records)).toBe(8);
    expect(totalSleepHours(records)).toBe(24);
    expect(longestNight(records)).toBe(10);
    expect(shortestNight(records)).toBe(6);
    expect(averageDuration([])).toBeNull();
    expect(medianDuration([])).toBeNull();
    expect(totalSleepHours([])).toBe(0);
    expect(longestNight([])).toBeNull();
    expect(shortestNight([])).toBeNull();
    const oneNight = [record('2026-07-16', 7.5)];
    expect(averageDuration(oneNight)).toBe(7.5);
    expect(medianDuration(oneNight)).toBe(7.5);
    expect(longestNight(oneNight)).toBe(7.5);
    expect(shortestNight(oneNight)).toBe(7.5);
  });

  it('calculates fixed and all-time tracking coverage', () => {
    const sparse = [record('2026-07-14', 8), record('2026-07-16', 8)];
    expect(trackingCoverage(sparse, { days: 30, referenceDayKey: '2026-07-16' })).toBe(7);
    expect(trackingCoverage(sparse, { days: null, referenceDayKey: '2026-07-16' })).toBe(67);
    expect(trackingCoverage([], { days: 30, referenceDayKey: '2026-07-16' })).toBe(0);
  });

  it('filters fixed ranges relative to their reference wake day', () => {
    expect(recordsInRange(records, 2, '2026-07-16').map((item) => item.dayKey)).toEqual([
      '2026-07-15',
      '2026-07-16',
    ]);
    expect(recordsInRange(records, null, '2026-07-16')).toEqual(records);
  });

  it('calculates goal duration and the inclusive 45-minute hit boundary', () => {
    expect(goalDurationHours(22 * 60, 7 * 60)).toBe(9);
    expect(goalDurationHours(1 * 60, 7 * 60)).toBe(6);
    const hits = [record('2026-07-14', 7.25), record('2026-07-15', 8.75), record('2026-07-16', 8.76)];
    expect(goalHitRate(hits, 8)).toBe(67);
    expect(goalHitRate([], 8)).toBe(0);
  });
});

describe('metrics series and streaks', () => {
  it('compares adjacent complete trend windows', () => {
    const improving = Array.from({ length: 14 }, (_, index) =>
      record(`2026-07-${String(index + 1).padStart(2, '0')}`, index < 7 ? 6 : 9),
    );
    expect(durationTrendPercent(improving)).toBe(50);
    expect(durationTrendPercent(improving.slice(1))).toBeNull();
    expect(durationTrendPercent([])).toBeNull();
  });

  it('returns null moving averages until the window is complete', () => {
    const points = movingAverageSeries(
      [record('2026-07-01', 1), record('2026-07-02', 2), record('2026-07-03', 3), record('2026-07-04', 4)],
      3,
    );
    expect(points.map((point) => point.movingAverageHours)).toEqual([null, null, 2, 3]);
    expect(movingAverageSeries([], 7)).toEqual([]);
  });

  it('anchors the current streak to today or yesterday and finds the longest run', () => {
    const records = [
      record('2026-07-04', 8),
      record('2026-07-05', 8),
      record('2026-07-06', 8),
      record('2026-07-08', 8),
      record('2026-07-09', 8),
    ];
    expect(currentStreak(records, '2026-07-10')).toBe(2);
    expect(currentStreak(records, '2026-07-11')).toBe(0);
    expect(longestStreak(records)).toBe(3);
    expect(currentStreak([], '2026-07-10')).toBe(0);
    expect(longestStreak([])).toBe(0);
  });
});
