import {
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
} from '../src/domain/metrics/core';
import type { SleepSession } from '../src/domain/models';
import gapsStreaksFixture from './fixtures/gaps-streaks.json';
import regularSleeperFixture from './fixtures/regular-sleeper.json';
import shiftWorkerFixture from './fixtures/shift-worker.json';
import subFiveMinuteNoiseFixture from './fixtures/sub-5-min-noise.json';
import timezoneTravelerFixture from './fixtures/timezone-traveler.json';

const fixtureNames = [
  'regular-sleeper',
  'shift-worker',
  'timezone-traveler',
  'sub-5-min-noise',
  'gaps-streaks',
] as const;

interface FixtureSession {
  end: string | null;
  endTimeZone: string | null;
  id: string;
  start: string;
  startTimeZone: string;
}

interface FixtureExpected {
  alignmentDaily: number[];
  alignmentTrend: number[];
  bedtimeOffsets: number[];
  bucketCounts: number[];
  dayKeys: string[];
  debtSeries: number[];
  durations: number[];
  midpointOffsets: number[];
  movingAverages: Array<number | null>;
  rollingLast: number[] | null;
  scalars: Record<string, number | null>;
  wakeOffsets: number[];
  weekdayAverages: number[];
  weekdayNights: number[];
  weekdays: number[];
}

interface Fixture {
  expected: FixtureExpected;
  goals: { sleepMinutes: number; wakeMinutes: number };
  name: string;
  referenceDayKey: string;
  sessions: FixtureSession[];
}

const fixtures: Record<(typeof fixtureNames)[number], Fixture> = {
  'gaps-streaks': gapsStreaksFixture as Fixture,
  'regular-sleeper': regularSleeperFixture as Fixture,
  'shift-worker': shiftWorkerFixture as Fixture,
  'sub-5-min-noise': subFiveMinuteNoiseFixture as Fixture,
  'timezone-traveler': timezoneTravelerFixture as Fixture,
};

function toSessions(sessions: FixtureSession[]): SleepSession[] {
  return sessions.map((session) => ({
    createdAt: 0,
    endTime: session.end === null ? null : Date.parse(session.end),
    endTimeZone: session.endTimeZone,
    id: session.id,
    startTime: Date.parse(session.start),
    startTimeZone: session.startTimeZone,
    tag: 'Sleep',
    updatedAt: 0,
  }));
}

function offsetForMinutes(minutes: number): number {
  const hour = minutes / 60;
  return (hour < 18 ? hour + 24 : hour) - 18;
}

function rounded(values: readonly number[]): number[] {
  return values.map((value) => Number(value.toFixed(6)));
}

describe.each(fixtureNames)('golden metric parity: %s', (fixtureName) => {
  const fixture = fixtures[fixtureName];
  const expected = fixture.expected;
  const records = createNightRecords(toSessions(fixture.sessions));
  const targetDuration = goalDurationHours(
    fixture.goals.sleepMinutes,
    fixture.goals.wakeMinutes,
  );
  const targetSleepOffset = offsetForMinutes(fixture.goals.sleepMinutes);
  const targetWakeOffset = offsetForMinutes(fixture.goals.wakeMinutes);

  it('matches canonical night records and endpoint timezones', () => {
    expect(records.map((record) => record.dayKey)).toEqual(expected.dayKeys);
    expect(records.map((record) => record.weekday)).toEqual(expected.weekdays);
    expect(rounded(records.map((record) => record.durationHours))).toEqual(expected.durations);
    expect(rounded(records.map((record) => record.bedtimeOffset))).toEqual(expected.bedtimeOffsets);
    expect(rounded(records.map((record) => record.wakeOffset))).toEqual(expected.wakeOffsets);
    expect(rounded(records.map((record) => record.midpointOffset))).toEqual(expected.midpointOffsets);
  });

  it('matches every core scalar metric', () => {
    const scalars = expected.scalars;
    expect(averageDuration(records)).toBe(scalars.average);
    expect(medianDuration(records)).toBe(scalars.median);
    expect(totalSleepHours(records)).toBe(scalars.total);
    expect(longestNight(records)).toBe(scalars.longest);
    expect(shortestNight(records)).toBe(scalars.shortest);
    expect(trackingCoverage(records, { days: 30, referenceDayKey: fixture.referenceDayKey })).toBe(scalars.coverage30);
    expect(trackingCoverage(records, { days: null, referenceDayKey: fixture.referenceDayKey })).toBe(scalars.coverageAll);
    expect(goalHitRate(records, targetDuration)).toBe(scalars.goalHitRate);
    expect(durationTrendPercent(records)).toBe(scalars.trend);
    expect(currentStreak(records, fixture.referenceDayKey)).toBe(scalars.currentStreak);
    expect(longestStreak(records)).toBe(scalars.longestStreak);
    expect(recordsInRange(records, 30, fixture.referenceDayKey).map((record) => record.dayKey)).toEqual(expected.dayKeys);
  });

  it('matches moving-average and cumulative-debt series', () => {
    expect(
      movingAverageSeries(records).map((point) =>
        point.movingAverageHours === null
          ? null
          : Number(point.movingAverageHours.toFixed(6)),
      ),
    ).toEqual(expected.movingAverages);
    expect(rounded(cumulativeDebtSeries(records, targetDuration).map((point) => point.cumulativeHours))).toEqual(expected.debtSeries);
  });

  it('matches every advanced scalar metric', () => {
    const scalars = expected.scalars;
    expect(sleepConsistencyScore(records)).toBe(scalars.sleepConsistency);
    expect(wakeConsistencyScore(records)).toBe(scalars.wakeConsistency);
    expect(scheduleAccuracyScore(records, targetSleepOffset, targetWakeOffset)).toBe(scalars.scheduleAccuracy);
    expect(regularityScore(records)).toBe(scalars.regularity);
    expect(socialJetlagHours(records)).toBe(scalars.socialJetlag);
    expect(cumulativeDebtHours(records, targetDuration)).toBe(scalars.cumulativeDebt);
  });

  it('matches rolling consistency, weekday, and histogram outputs', () => {
    const rolling = rollingConsistencySeries(
      records,
      targetSleepOffset,
      targetWakeOffset,
    );
    const last = rolling.at(-1);
    const rollingLast = last?.sleepConsistency === null
      ? null
      : [last?.sleepConsistency, last?.wakeConsistency, last?.scheduleAccuracy];
    expect(rollingLast).toEqual(expected.rollingLast);
    const weekdays = weekdayAverages(records);
    expect(rounded(weekdays.map((weekday) => weekday.averageHours))).toEqual(expected.weekdayAverages);
    expect(weekdays.map((weekday) => weekday.nights)).toEqual(expected.weekdayNights);
    expect(durationBuckets(records).map((bucket) => bucket.count)).toEqual(expected.bucketCounts);
  });

  it('matches weighted alignment and EMA trend series', () => {
    const alignment = sleepAlignmentSeries(records, targetDuration, targetSleepOffset);
    expect(rounded(alignment.map((point) => point.dailyScore))).toEqual(expected.alignmentDaily);
    expect(rounded(alignment.map((point) => point.trendScore))).toEqual(expected.alignmentTrend);
  });
});
