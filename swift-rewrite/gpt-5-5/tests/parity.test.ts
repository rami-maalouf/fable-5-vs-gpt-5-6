import type { SleepSession } from '../src/domain/models';
import {
  averageDurationHours,
  buildNightRecords,
  currentStreak,
  durationTrendPercent,
  goalHitRate,
  longestNight,
  longestStreak,
  medianDurationHours,
  movingAverageSeries,
  recordsInRange,
  shortestNight,
  totalSleepHours,
  trackingCoverage,
} from '../src/domain/metrics/core';
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
  targetOffsetsFromMinutes,
  wakeConsistencyScore,
  weekdayAverages,
} from '../src/domain/metrics/advanced';

const gapsStreakBreaksFixture = require('./fixtures/sleep-metrics/gaps-streak-breaks.json') as Fixture;
const regularSleeperFixture = require('./fixtures/sleep-metrics/regular-sleeper.json') as Fixture;
const shiftWorkerCrossingMidnightFixture = require('./fixtures/sleep-metrics/shift-worker-crossing-midnight.json') as Fixture;
const subFiveMinuteNoiseFixture = require('./fixtures/sleep-metrics/sub-five-minute-noise.json') as Fixture;
const timezoneTravelerFixture = require('./fixtures/sleep-metrics/timezone-traveler.json') as Fixture;

type FixtureSession = {
  endTime: string | null;
  endTimeZone: string | null;
  id: string;
  startTime: string;
  startTimeZone: string;
  tag?: string | null;
};

type Fixture = {
  expected: unknown;
  name: string;
  referenceDate: string;
  sessions: FixtureSession[];
  settings: {
    sleepTargetMinutes: number;
    wakeTargetMinutes: number;
  };
};

declare function require(path: string): unknown;

const fixtures = [
  { fileName: 'gaps-streak-breaks.json', fixture: gapsStreakBreaksFixture },
  { fileName: 'regular-sleeper.json', fixture: regularSleeperFixture },
  { fileName: 'shift-worker-crossing-midnight.json', fixture: shiftWorkerCrossingMidnightFixture },
  { fileName: 'sub-five-minute-noise.json', fixture: subFiveMinuteNoiseFixture },
  { fileName: 'timezone-traveler.json', fixture: timezoneTravelerFixture },
];

function toSession(session: FixtureSession): SleepSession {
  const startTime = new Date(session.startTime);
  const endTime = session.endTime ? new Date(session.endTime) : null;

  return {
    id: session.id,
    startTime,
    endTime,
    startTimeZone: session.startTimeZone,
    endTimeZone: session.endTimeZone,
    createdAt: startTime,
    updatedAt: endTime ?? startTime,
    tag: session.tag,
  };
}

function roundNumber(value: number) {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function stableValue(value: unknown): unknown {
  if (typeof value === 'number') {
    return roundNumber(value);
  }

  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stableValue(entryValue)]),
    );
  }

  return value;
}

function metricSnapshot(fixture: Fixture) {
  const sessions = fixture.sessions.map(toSession);
  const records = buildNightRecords(sessions);
  const referenceDate = new Date(fixture.referenceDate);
  const target = targetOffsetsFromMinutes(fixture.settings.sleepTargetMinutes, fixture.settings.wakeTargetMinutes);
  const range30Records = recordsInRange(records, '30D', referenceDate);
  const longest = longestNight(records);
  const shortest = shortestNight(records);

  return stableValue({
    advanced: {
      cumulativeDebtHours: cumulativeDebtHours(records, target.targetDurationHours),
      cumulativeDebtSeries: cumulativeDebtSeries(records, target.targetDurationHours),
      durationBuckets: durationBuckets(records),
      regularityScore: regularityScore(records),
      rollingConsistency14: rollingConsistencySeries(records, target, 14),
      scheduleAccuracyScore: scheduleAccuracyScore(records, target),
      sleepAlignmentSeries: sleepAlignmentSeries(records, target).map((point) => ({
        consistencyScore: point.consistencyScore,
        dailyScore: point.dailyScore,
        dateKey: point.dateKey,
        durationScore: point.durationScore,
        phaseScore: point.phaseScore,
        timingScore: point.timingScore,
        trendScore: point.trendScore,
      })),
      sleepConsistencyScore: sleepConsistencyScore(records),
      socialJetlagHours: socialJetlagHours(records),
      wakeConsistencyScore: wakeConsistencyScore(records),
      weekdayAverages: weekdayAverages(records),
    },
    core: {
      averageDurationHours: averageDurationHours(records),
      currentStreak: currentStreak(records, referenceDate),
      durationTrendPercent7: durationTrendPercent(records, 7),
      goalHitRate: goalHitRate(records, target.targetDurationHours),
      longestNightHours: longest?.durationHours ?? null,
      longestStreak: longestStreak(records),
      medianDurationHours: medianDurationHours(records),
      movingAverage7: movingAverageSeries(records, 7),
      range30Count: range30Records.length,
      shortestNightHours: shortest?.durationHours ?? null,
      totalSleepHours: totalSleepHours(records),
      trackingCoverage30D: trackingCoverage(range30Records, '30D', { allRecords: records, referenceDate }),
      trackingCoverageAll: trackingCoverage(records, 'All', { referenceDate }),
    },
    records: records.map((record) => ({
      bedtimeOffsetHours: record.bedtimeOffsetHours,
      dateKey: record.dateKey,
      durationHours: record.durationHours,
      midpointOffsetHours: record.midpointOffsetHours,
      sessionId: record.sessionId,
      wakeOffsetHours: record.wakeOffsetHours,
      weekday: record.weekday,
    })),
    targets: target,
  });
}

describe('sleep metric golden fixture parity', () => {
  it('has the required five swift-derived fixture sets', () => {
    expect(fixtures.map(({ fileName }) => fileName)).toEqual([
      'gaps-streak-breaks.json',
      'regular-sleeper.json',
      'shift-worker-crossing-midnight.json',
      'sub-five-minute-noise.json',
      'timezone-traveler.json',
    ]);
  });

  for (const { fileName, fixture } of fixtures) {
    it(`matches ${fileName}`, () => {
      expect(metricSnapshot(fixture)).toEqual(fixture.expected);
    });
  }
});
