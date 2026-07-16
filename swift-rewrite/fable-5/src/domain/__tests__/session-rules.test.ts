// ports behavior of: Models/BlockedProfileSessions.swift, Views/Logs/SleepSessionEditorView.swift,
// Utils/DateFormatters.swift, Models/SleepSettings.swift
import type { SleepSession } from '../models';
import {
  MINIMUM_SESSION_SECONDS,
  addDays,
  canonicalNight,
  dayKey,
  formatDuration,
  formatMinutes,
  goalMatchScore,
  goalMatchSubtitle,
  averageGoalDeviationMinutes,
  isValidSession,
  sessionDurationSeconds,
  sleepGoalSeconds,
  wakeDay,
  wrappedMinuteDifference,
  zonedParts,
} from '../session-rules';

function makeSession(overrides: Partial<SleepSession> = {}): SleepSession {
  return {
    id: 'test-id',
    tag: 'Sleep Mode',
    startTime: Date.UTC(2025, 0, 15, 3, 0, 0), // 2025-01-15 03:00 utc
    endTime: Date.UTC(2025, 0, 15, 11, 0, 0), // 8h later
    startTimeZone: 'America/Denver',
    endTimeZone: 'America/Denver',
    createdAt: Date.UTC(2025, 0, 15, 3, 0, 0),
    updatedAt: Date.UTC(2025, 0, 15, 11, 0, 0),
    ...overrides,
  };
}

describe('session validity (5-minute rule)', () => {
  test('minimum duration is 300 seconds', () => {
    expect(MINIMUM_SESSION_SECONDS).toBe(300);
  });

  test('a session of exactly 5 minutes is valid (>= boundary, matches swift)', () => {
    const start = Date.UTC(2025, 0, 15, 3, 0, 0);
    const s = makeSession({ startTime: start, endTime: start + 300_000 });
    expect(isValidSession(s)).toBe(true);
  });

  test('a session under 5 minutes is invalid', () => {
    const start = Date.UTC(2025, 0, 15, 3, 0, 0);
    const s = makeSession({ startTime: start, endTime: start + 299_000 });
    expect(isValidSession(s)).toBe(false);
  });

  test('active session duration is measured against now', () => {
    const start = Date.UTC(2025, 0, 15, 3, 0, 0);
    const s = makeSession({ endTime: null, startTime: start });
    expect(sessionDurationSeconds(s, start + 600_000)).toBe(600);
    expect(isValidSession(s, start + 100_000)).toBe(false);
    expect(isValidSession(s, start + 400_000)).toBe(true);
  });
});

describe('wake-day attribution', () => {
  test('session belongs to the day it ended (startOfDay of end time)', () => {
    // ends 04:00 jan 15 denver time (11:00 utc)
    const s = makeSession();
    expect(dayKey(wakeDay(s))).toBe('2025-01-15');
  });

  test('midnight-crossing session attributes to the wake day', () => {
    // 22:30 jan 14 denver -> 06:30 jan 15 denver
    const s = makeSession({
      startTime: Date.UTC(2025, 0, 15, 5, 30, 0),
      endTime: Date.UTC(2025, 0, 15, 13, 30, 0),
    });
    expect(dayKey(wakeDay(s))).toBe('2025-01-15');
  });

  test('wake day is computed in the END timezone, not the start timezone', () => {
    // traveler: falls asleep in tokyo, wakes in los angeles.
    // end instant: 2025-03-10 14:00 utc = 07:00 mar 10 in LA, but 23:00 mar 10 in tokyo.
    const s = makeSession({
      startTime: Date.UTC(2025, 2, 10, 6, 0, 0),
      endTime: Date.UTC(2025, 2, 10, 14, 0, 0),
      startTimeZone: 'Asia/Tokyo',
      endTimeZone: 'America/Los_Angeles',
    });
    expect(dayKey(wakeDay(s))).toBe('2025-03-10');
  });

  test('end timezone falls back to start timezone when missing', () => {
    // end instant 2025-01-15 04:00 utc = 13:00 jan 15 tokyo, 21:00 jan 14 denver
    const s = makeSession({
      startTime: Date.UTC(2025, 0, 14, 20, 0, 0),
      endTime: Date.UTC(2025, 0, 15, 4, 0, 0),
      startTimeZone: 'Asia/Tokyo',
      endTimeZone: null,
    });
    expect(dayKey(wakeDay(s))).toBe('2025-01-15');
  });

  test('active session estimates wake day as the day after start', () => {
    // started 23:00 jan 14 denver time (06:00 jan 15 utc)
    const s = makeSession({
      startTime: Date.UTC(2025, 0, 15, 6, 0, 0),
      endTime: null,
    });
    expect(dayKey(wakeDay(s))).toBe('2025-01-15');
  });

  test('dst fall-back night still lands on the correct wake day', () => {
    // us dst ended 2025-11-02 02:00 america/denver.
    // 22:00 nov 1 mdt (04:00 utc nov 2) -> 07:00 nov 2 mst (14:00 utc)
    const s = makeSession({
      startTime: Date.UTC(2025, 10, 2, 4, 0, 0),
      endTime: Date.UTC(2025, 10, 2, 14, 0, 0),
    });
    expect(dayKey(wakeDay(s))).toBe('2025-11-02');
    // 9 wall-clock hours minus none: the instant delta is exactly 10h (extra dst hour)
    expect(sessionDurationSeconds(s)).toBe(10 * 3600);
  });
});

describe('canonical night selection', () => {
  test('longest session on a wake day is the canonical night', () => {
    const nap = makeSession({
      id: 'nap',
      startTime: Date.UTC(2025, 0, 15, 20, 0, 0),
      endTime: Date.UTC(2025, 0, 15, 21, 0, 0),
    });
    const night = makeSession({
      id: 'night',
      startTime: Date.UTC(2025, 0, 15, 5, 0, 0),
      endTime: Date.UTC(2025, 0, 15, 13, 0, 0),
    });
    expect(canonicalNight([nap, night])?.id).toBe('night');
  });

  test('canonical night of an empty list is null', () => {
    expect(canonicalNight([])).toBeNull();
  });
});

describe('calendar day helpers', () => {
  test('zonedParts reads wall-clock components in the given timezone', () => {
    const parts = zonedParts(Date.UTC(2025, 0, 15, 11, 30, 0), 'America/Denver');
    expect(parts).toEqual({ year: 2025, month: 1, day: 15, hour: 4, minute: 30, second: 0 });
  });

  test('addDays crosses month boundaries', () => {
    expect(dayKey(addDays({ year: 2025, month: 1, day: 31 }, 1))).toBe('2025-02-01');
    expect(dayKey(addDays({ year: 2025, month: 3, day: 1 }, -1))).toBe('2025-02-28');
  });
});

describe('sleep goal', () => {
  test('goal seconds wraps across midnight (22:00 -> 07:00 = 9h)', () => {
    expect(sleepGoalSeconds(22 * 60, 7 * 60)).toBe(9 * 3600);
  });

  test('same sleep and wake time wraps to a full day', () => {
    expect(sleepGoalSeconds(420, 420)).toBe(24 * 3600);
  });

  test('daytime goal does not wrap (09:00 -> 17:00 = 8h)', () => {
    expect(sleepGoalSeconds(9 * 60, 17 * 60)).toBe(8 * 3600);
  });
});

describe('goal match (editor formula)', () => {
  test('wrapped minute difference takes the short way around midnight', () => {
    expect(wrappedMinuteDifference(23 * 60, 1 * 60)).toBe(120);
    expect(wrappedMinuteDifference(1 * 60, 23 * 60)).toBe(120);
    expect(wrappedMinuteDifference(600, 600)).toBe(0);
  });

  test('exact match scores 100', () => {
    expect(averageGoalDeviationMinutes(1320, 420, 1320, 420)).toBe(0);
    expect(goalMatchScore(1320, 420, 1320, 420)).toBe(100);
    expect(goalMatchSubtitle(0)).toBe('Exactly on target');
  });

  test('deduction is 30 points per hour of average deviation, floored to 0', () => {
    // 60 min off on each leg -> avg 60 -> deduction 30
    expect(goalMatchScore(1320 + 60, 420 + 60, 1320, 420)).toBe(70);
    // massive deviation floors at 0 (max wrapped avg is 720 -> deduction 360)
    expect(goalMatchScore(1320 + 720, 420 + 720, 1320, 420)).toBe(0);
  });

  test('integer truncation matches swift Int() cast', () => {
    // avg deviation 25min -> 25/60*30 = 12.5 -> Int() truncates to 12 -> 88
    expect(goalMatchScore(1320 + 25, 420 + 25, 1320, 420)).toBe(88);
  });

  test('subtitle buckets', () => {
    expect(goalMatchSubtitle(3)).toBe('Within 5 min');
    expect(goalMatchSubtitle(45)).toBe('45m avg off goal');
  });
});

describe('formatters', () => {
  test('formatDuration matches DateFormatters.formatDuration', () => {
    expect(formatDuration(7 * 3600 + 32 * 60 + 5)).toBe('7h 32m 5s');
    expect(formatDuration(32 * 60 + 5)).toBe('32m 5s');
    expect(formatDuration(42)).toBe('42s');
  });

  test('formatMinutes matches DateFormatters.formatMinutes', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(60)).toBe('60 min');
    expect(formatMinutes(120)).toBe('2h');
    expect(formatMinutes(132)).toBe('2h 12m');
  });
});
