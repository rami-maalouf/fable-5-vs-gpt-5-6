import type { SleepSession } from '../src/domain/models';
import {
  MINIMUM_SESSION_DURATION_SECONDS,
  calculateGoalMatch,
  formatDuration,
  formatGoalMatchScore,
  formatGoalMatchSubtitle,
  getSessionDurationSeconds,
  getWakeDayKey,
  isActiveSleepSession,
  isValidSleepSession,
  selectCanonicalSessionsByWakeDay,
  startOfDayInTimeZone,
} from '../src/domain/session-rules';

function session(overrides: Partial<SleepSession> = {}): SleepSession {
  return {
    id: 'session-1',
    tag: 'Manual Log',
    startTime: Date.parse('2026-01-10T07:30:00.000Z'),
    endTime: Date.parse('2026-01-10T15:30:00.000Z'),
    startTimeZone: 'America/Los_Angeles',
    endTimeZone: 'America/Los_Angeles',
    createdAt: Date.parse('2026-01-10T07:30:00.000Z'),
    updatedAt: Date.parse('2026-01-10T15:30:00.000Z'),
    ...overrides,
  };
}

describe('session validity', () => {
  it('uses the inclusive five-minute validity boundary', () => {
    const startTime = Date.parse('2026-01-10T07:30:00.000Z');

    expect(MINIMUM_SESSION_DURATION_SECONDS).toBe(300);
    expect(isValidSleepSession(session({ startTime, endTime: startTime + 299_999 }))).toBe(false);
    expect(isValidSleepSession(session({ startTime, endTime: startTime + 300_000 }))).toBe(true);
  });

  it('rejects active and backwards sessions', () => {
    const startTime = Date.parse('2026-01-10T07:30:00.000Z');

    expect(isActiveSleepSession(session({ startTime, endTime: null }))).toBe(true);
    expect(isValidSleepSession(session({ startTime, endTime: null }))).toBe(false);
    expect(isValidSleepSession(session({ startTime, endTime: startTime - 1 }))).toBe(false);
    expect(getSessionDurationSeconds(session({ startTime, endTime: null }))).toBeNull();
  });
});

describe('wake-day attribution', () => {
  it('attributes a midnight-crossing session to its local wake day', () => {
    const night = session({
      startTime: Date.parse('2026-01-10T07:30:00.000Z'),
      endTime: Date.parse('2026-01-10T15:15:00.000Z'),
      startTimeZone: 'America/Los_Angeles',
      endTimeZone: 'America/Los_Angeles',
    });

    expect(getWakeDayKey(night)).toBe('2026-01-10');
  });

  it('uses the end timezone when a traveler changes zones', () => {
    const travelNight = session({
      startTime: Date.parse('2026-07-14T21:00:00.000Z'),
      endTime: Date.parse('2026-07-15T02:30:00.000Z'),
      startTimeZone: 'America/New_York',
      endTimeZone: 'Europe/London',
    });

    expect(getWakeDayKey(travelNight)).toBe('2026-07-15');
  });

  it('finds local start of day across a daylight-saving transition', () => {
    const afterSpringForward = Date.parse('2026-03-08T10:30:00.000Z');
    const dstNight = session({
      startTime: Date.parse('2026-03-08T07:30:00.000Z'),
      endTime: afterSpringForward,
      startTimeZone: 'America/Edmonton',
      endTimeZone: 'America/Edmonton',
    });

    expect(getSessionDurationSeconds(dstNight)).toBe(3 * 60 * 60);
    expect(getWakeDayKey(dstNight)).toBe('2026-03-08');
    expect(startOfDayInTimeZone(afterSpringForward, 'America/Edmonton')).toBe(
      Date.parse('2026-03-08T07:00:00.000Z'),
    );
  });

  it('rejects invalid stored timezone identifiers', () => {
    expect(() => getWakeDayKey(session({ endTimeZone: 'Mars/Olympus_Mons' }))).toThrow(
      'Invalid IANA time zone',
    );
  });
});

describe('canonical night selection', () => {
  it('keeps the longest valid session for each wake day', () => {
    const shorter = session({
      id: 'shorter',
      startTime: Date.parse('2026-01-10T06:00:00.000Z'),
      endTime: Date.parse('2026-01-10T12:00:00.000Z'),
    });
    const longer = session({
      id: 'longer',
      startTime: Date.parse('2026-01-10T05:00:00.000Z'),
      endTime: Date.parse('2026-01-10T13:00:00.000Z'),
    });
    const noise = session({
      id: 'noise',
      startTime: Date.parse('2026-01-11T07:00:00.000Z'),
      endTime: Date.parse('2026-01-11T07:02:00.000Z'),
    });

    const canonical = selectCanonicalSessionsByWakeDay([shorter, noise, longer]);

    expect(canonical.size).toBe(1);
    expect(canonical.get('2026-01-10')?.id).toBe('longer');
  });

  it('uses a deterministic tie break for equal durations', () => {
    const later = session({
      id: 'later',
      startTime: Date.parse('2026-01-10T07:00:00.000Z'),
      endTime: Date.parse('2026-01-10T13:00:00.000Z'),
    });
    const earlier = session({
      id: 'earlier',
      startTime: Date.parse('2026-01-10T06:00:00.000Z'),
      endTime: Date.parse('2026-01-10T12:00:00.000Z'),
    });

    expect(selectCanonicalSessionsByWakeDay([later, earlier]).get('2026-01-10')?.id).toBe(
      'earlier',
    );
  });
});

describe('formatters', () => {
  it('formats durations in the compact product style', () => {
    expect(formatDuration(27_150)).toBe('7h 32m');
    expect(formatDuration(8 * 60 * 60)).toBe('8h');
    expect(formatDuration(2_700)).toBe('45m');
    expect(formatDuration(0)).toBe('0m');
  });

  it('ports the wrapped goal-match calculation and copy', () => {
    expect(
      calculateGoalMatch({
        sleepMinutes: 22 * 60,
        wakeMinutes: 7 * 60,
        targetSleepMinutes: 22 * 60,
        targetWakeMinutes: 7 * 60,
      }),
    ).toEqual({ averageDeviationMinutes: 0, score: 100 });

    const wrapped = calculateGoalMatch({
      sleepMinutes: 23 * 60 + 55,
      wakeMinutes: 7 * 60,
      targetSleepMinutes: 5,
      targetWakeMinutes: 7 * 60,
    });

    expect(wrapped).toEqual({ averageDeviationMinutes: 5, score: 98 });
    expect(formatGoalMatchScore(wrapped.score)).toBe('98%');
    expect(formatGoalMatchSubtitle(wrapped.averageDeviationMinutes)).toBe('Within 5 min');
    expect(formatGoalMatchSubtitle(0)).toBe('Exactly on target');
    expect(formatGoalMatchSubtitle(17)).toBe('17m avg off goal');
  });
});
