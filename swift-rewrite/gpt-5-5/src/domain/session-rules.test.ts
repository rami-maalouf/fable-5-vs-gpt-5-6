import type { SleepSession } from './models';
import {
  canonicalSessionsByWakeDay,
  durationSeconds,
  formatDuration,
  formatGoalMatch,
  getWakeDayKey,
  isValidSleepSession,
  makeDateInTimeZone,
} from './session-rules';

function session(overrides: Partial<SleepSession>): SleepSession {
  return {
    id: 'session',
    startTime: new Date('2026-01-01T00:00:00.000Z'),
    endTime: new Date('2026-01-01T08:00:00.000Z'),
    startTimeZone: 'America/Edmonton',
    endTimeZone: 'America/Edmonton',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T08:00:00.000Z'),
    ...overrides,
  };
}

describe('session rules', () => {
  it('rejects completed sessions under the 300 second minimum', () => {
    const shortSession = session({
      startTime: new Date('2026-02-01T07:00:00.000Z'),
      endTime: new Date('2026-02-01T07:04:59.000Z'),
    });
    const minimumSession = session({
      startTime: new Date('2026-02-01T07:00:00.000Z'),
      endTime: new Date('2026-02-01T07:05:00.000Z'),
    });

    expect(isValidSleepSession(shortSession)).toBe(false);
    expect(isValidSleepSession(minimumSession)).toBe(true);
  });

  it('attributes a midnight-crossing session to the local wake day', () => {
    const overnight = session({
      startTime: new Date('2026-02-02T06:30:00.000Z'),
      endTime: new Date('2026-02-02T14:00:00.000Z'),
      startTimeZone: 'America/Edmonton',
      endTimeZone: 'America/Edmonton',
    });

    expect(getWakeDayKey(overnight)).toBe('2026-02-02');
  });

  it('keeps real elapsed duration across a dst jump while using the wake timezone for day keys', () => {
    const springForward = session({
      startTime: new Date('2026-03-08T06:30:00.000Z'),
      endTime: new Date('2026-03-08T07:30:00.000Z'),
      startTimeZone: 'America/New_York',
      endTimeZone: 'America/New_York',
    });

    expect(durationSeconds(springForward)).toBe(3600);
    expect(getWakeDayKey(springForward)).toBe('2026-03-08');
  });

  it('uses the end timezone when a traveler starts and wakes in different zones', () => {
    const traveler = session({
      startTime: new Date('2026-04-10T14:30:00.000Z'),
      endTime: new Date('2026-04-10T22:30:00.000Z'),
      startTimeZone: 'Asia/Tokyo',
      endTimeZone: 'America/Vancouver',
    });

    expect(getWakeDayKey(traveler)).toBe('2026-04-10');
  });

  it('picks the longest valid completed session as the canonical night for each wake day', () => {
    const shortNoise = session({
      id: 'noise',
      startTime: new Date('2026-05-02T03:00:00.000Z'),
      endTime: new Date('2026-05-02T03:03:00.000Z'),
    });
    const first = session({
      id: 'first',
      startTime: new Date('2026-05-02T04:00:00.000Z'),
      endTime: new Date('2026-05-02T10:00:00.000Z'),
    });
    const longest = session({
      id: 'longest',
      startTime: new Date('2026-05-02T05:00:00.000Z'),
      endTime: new Date('2026-05-02T12:30:00.000Z'),
    });
    const nextNight = session({
      id: 'next',
      startTime: new Date('2026-05-03T05:00:00.000Z'),
      endTime: new Date('2026-05-03T12:00:00.000Z'),
    });

    expect(canonicalSessionsByWakeDay([shortNoise, first, nextNight, longest]).map(({ id }) => id)).toEqual([
      'longest',
      'next',
    ]);
  });

  it('formats durations and goal-match feedback using swift-derived rules', () => {
    const sleepDate = makeDateInTimeZone('2026-06-01', 23, 30, 'America/Edmonton');
    const wakeDate = makeDateInTimeZone('2026-06-02', 6, 30, 'America/Edmonton');

    expect(formatDuration(7 * 3600 + 32 * 60)).toBe('7h 32m');
    expect(
      formatGoalMatch({
        sleepDate,
        wakeDate,
        sleepTargetMinutes: 23 * 60 + 30,
        wakeTargetMinutes: 6 * 60 + 30,
        timeZone: 'America/Edmonton',
      }),
    ).toEqual({
      averageDeviationMinutes: 0,
      score: 100,
      subtitle: 'Exactly on target',
    });
    expect(
      formatGoalMatch({
        sleepDate: makeDateInTimeZone('2026-06-01', 23, 25, 'America/Edmonton'),
        wakeDate: makeDateInTimeZone('2026-06-02', 6, 40, 'America/Edmonton'),
        sleepTargetMinutes: 23 * 60 + 30,
        wakeTargetMinutes: 6 * 60 + 30,
        timeZone: 'America/Edmonton',
      }),
    ).toEqual({
      averageDeviationMinutes: 7,
      score: 97,
      subtitle: '7m avg off goal',
    });
  });
});
