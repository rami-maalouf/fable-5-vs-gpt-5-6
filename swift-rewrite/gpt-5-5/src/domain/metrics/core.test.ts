import type { SleepSession } from '../models';
import { makeDateInTimeZone } from '../session-rules';
import {
  averageDurationHours,
  buildNightRecords,
  currentStreak,
  durationTrendPercent,
  goalDurationHours,
  goalHitRate,
  longestNight,
  longestStreak,
  medianDurationHours,
  movingAverageSeries,
  recordsInRange,
  shortestNight,
  totalSleepHours,
  trackingCoverage,
} from './core';

function addDays(dateKey: string, deltaDays: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + deltaDays, 12));
  return date.toISOString().slice(0, 10);
}

function session({
  durationHours,
  id,
  sleepMinutes = 23 * 60,
  timeZone = 'UTC',
  wakeDayKey,
}: {
  durationHours: number;
  id: string;
  sleepMinutes?: number;
  timeZone?: string;
  wakeDayKey: string;
}): SleepSession {
  const sleepDayKey = sleepMinutes >= 18 * 60 ? addDays(wakeDayKey, -1) : wakeDayKey;
  const sleepHour = Math.floor(sleepMinutes / 60);
  const sleepMinute = sleepMinutes % 60;
  const startTime = makeDateInTimeZone(sleepDayKey, sleepHour, sleepMinute, timeZone);
  const endTime = new Date(startTime.getTime() + durationHours * 3600 * 1000);

  return {
    id,
    startTime,
    endTime,
    startTimeZone: timeZone,
    endTimeZone: timeZone,
    createdAt: startTime,
    updatedAt: endTime,
  };
}

function record(dateKey: string, durationHours: number) {
  const [nightRecord] = buildNightRecords([session({ durationHours, id: dateKey, wakeDayKey: dateKey })]);
  if (!nightRecord) {
    throw new Error(`expected a valid night record for ${dateKey}`);
  }

  return nightRecord;
}

describe('sleep metrics core', () => {
  it('builds canonical night records with 18:00-relative offsets', () => {
    const shortNoise = session({ durationHours: 0.05, id: 'noise', wakeDayKey: '2026-07-14' });
    const shorterSameDay = session({ durationHours: 6, id: 'shorter', wakeDayKey: '2026-07-14' });
    const longestSameDay = session({ durationHours: 8, id: 'longest', wakeDayKey: '2026-07-14' });
    const nextNight = session({
      durationHours: 6,
      id: 'after-midnight-bedtime',
      sleepMinutes: 60,
      wakeDayKey: '2026-07-15',
    });

    const records = buildNightRecords([shortNoise, shorterSameDay, nextNight, longestSameDay]);

    expect(records.map(({ sessionId }) => sessionId)).toEqual(['longest', 'after-midnight-bedtime']);
    expect(records[0]).toMatchObject({
      bedtimeOffsetHours: 5,
      dateKey: '2026-07-14',
      durationHours: 8,
      midpointOffsetHours: 9,
      wakeOffsetHours: 13,
      weekday: 3,
    });
    expect(records[1]).toMatchObject({
      bedtimeOffsetHours: 7,
      wakeOffsetHours: 13,
    });
  });

  it('calculates basic duration aggregates for empty, single-night, and multi-night inputs', () => {
    const records = [record('2026-07-13', 6), record('2026-07-14', 7), record('2026-07-15', 8)];

    expect(averageDurationHours([])).toBeNull();
    expect(medianDurationHours([])).toBeNull();
    expect(longestNight([])).toBeNull();
    expect(shortestNight([])).toBeNull();
    expect(totalSleepHours([])).toBe(0);

    expect(averageDurationHours([records[0]])).toBe(6);
    expect(medianDurationHours(records)).toBe(7);
    expect(averageDurationHours(records)).toBe(7);
    expect(totalSleepHours(records)).toBe(21);
    expect(longestNight(records)?.dateKey).toBe('2026-07-15');
    expect(shortestNight(records)?.dateKey).toBe('2026-07-13');
  });

  it('filters records by swift-compatible metric ranges', () => {
    const records = [
      record('2026-06-16', 8),
      record('2026-06-17', 8),
      record('2026-07-16', 8),
    ];
    const referenceDate = new Date('2026-07-16T12:00:00.000Z');

    expect(recordsInRange(records, '30D', referenceDate).map(({ dateKey }) => dateKey)).toEqual([
      '2026-06-17',
      '2026-07-16',
    ]);
    expect(recordsInRange(records, 'All', referenceDate).map(({ dateKey }) => dateKey)).toEqual([
      '2026-06-16',
      '2026-06-17',
      '2026-07-16',
    ]);
  });

  it('calculates tracking coverage with range and all-time denominators', () => {
    const records = [record('2026-07-14', 8), record('2026-07-15', 7), record('2026-07-16', 9)];
    const referenceDate = new Date('2026-07-16T12:00:00.000Z');

    expect(trackingCoverage(records, '30D', { referenceDate })).toBe(10);
    expect(trackingCoverage(records, 'All', { referenceDate })).toBe(100);
    expect(trackingCoverage([], 'All', { referenceDate })).toBe(0);
  });

  it('calculates goal hit rate using the 45 minute tolerance', () => {
    const records = [record('2026-07-13', 7.25), record('2026-07-14', 8), record('2026-07-15', 8.8)];

    expect(goalDurationHours(22 * 60, 6 * 60)).toBe(8);
    expect(goalHitRate(records, 8)).toBe(67);
    expect(goalHitRate([], 8)).toBe(0);
  });

  it('calculates duration trend from the current and previous windows', () => {
    const records = [
      record('2026-07-12', 6),
      record('2026-07-13', 6),
      record('2026-07-14', 8),
      record('2026-07-15', 10),
    ];

    expect(durationTrendPercent(records, 2)).toBe(50);
    expect(durationTrendPercent(records.slice(0, 3), 2)).toBeNull();
    expect(
      durationTrendPercent(
        [
          { ...record('2026-07-12', 6), durationHours: 0 },
          { ...record('2026-07-13', 6), durationHours: 0 },
          record('2026-07-14', 8),
          record('2026-07-15', 10),
        ],
        2,
      ),
    ).toBeNull();
  });

  it('builds 7-day moving average points without inventing early values', () => {
    const records = [
      record('2026-07-10', 6),
      record('2026-07-11', 7),
      record('2026-07-12', 8),
      record('2026-07-13', 9),
    ];

    expect(movingAverageSeries(records, 3).map(({ movingAverageHours }) => movingAverageHours)).toEqual([
      null,
      null,
      7,
      8,
    ]);
  });

  it('calculates current and longest streaks across gaps', () => {
    const referenceDate = new Date('2026-07-16T12:00:00.000Z');
    const recordsWithGap = [record('2026-07-13', 8), record('2026-07-14', 8), record('2026-07-16', 8)];
    const aliveYesterday = [record('2026-07-14', 8), record('2026-07-15', 8)];

    expect(currentStreak([], referenceDate)).toBe(0);
    expect(currentStreak(recordsWithGap, referenceDate)).toBe(1);
    expect(longestStreak(recordsWithGap)).toBe(2);
    expect(currentStreak(aliveYesterday, referenceDate)).toBe(2);
    expect(longestStreak([record('2026-07-16', 8)])).toBe(1);
  });
});
