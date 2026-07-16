// ports behavior of: Utils/SleepGreetings.swift (bank sizes + selection rules)
import {
  AFTERNOON_GREETINGS,
  CURRENTLY_SLEEPING_GREETINGS,
  EARLY_MORNING_GREETINGS,
  EVENING_GREETINGS,
  HOUR_AFTER_WAKE_GREETINGS,
  HOUR_BEFORE_SLEEP_GREETINGS,
  MORNING_GREETINGS,
  NIGHT_GREETINGS,
  SHOULD_BE_SLEEPING_GREETINGS,
  getShuffledGreeting,
  greetingBank,
} from '../greetings';

const SLEEP = 22 * 60; // 22:00
const WAKE = 7 * 60; // 07:00

describe('bank sizes match the active entries in the swift source', () => {
  test.each([
    [EARLY_MORNING_GREETINGS, 11],
    [MORNING_GREETINGS, 5],
    [AFTERNOON_GREETINGS, 9],
    [EVENING_GREETINGS, 12],
    [NIGHT_GREETINGS, 10],
    [HOUR_BEFORE_SLEEP_GREETINGS, 11],
    [HOUR_AFTER_WAKE_GREETINGS, 10],
    [SHOULD_BE_SLEEPING_GREETINGS, 10],
    [CURRENTLY_SLEEPING_GREETINGS, 10],
  ])('bank has %#-indexed expected size', (bank, size) => {
    expect(bank).toHaveLength(size);
  });
});

describe('selection rules', () => {
  test('sleeping always wins', () => {
    expect(greetingBank(13 * 60, SLEEP, WAKE, true)).toBe(CURRENTLY_SLEEPING_GREETINGS);
  });

  test('within 60 minutes before bedtime', () => {
    expect(greetingBank(21 * 60 + 30, SLEEP, WAKE, false)).toBe(HOUR_BEFORE_SLEEP_GREETINGS);
    // exactly at bedtime is NOT "before" (minutesBeforeSleep must be > 0)
    expect(greetingBank(22 * 60, SLEEP, WAKE, false)).toBe(SHOULD_BE_SLEEPING_GREETINGS);
  });

  test('within 60 minutes after wake (inclusive of wake minute)', () => {
    expect(greetingBank(7 * 60, SLEEP, WAKE, false)).toBe(HOUR_AFTER_WAKE_GREETINGS);
    expect(greetingBank(8 * 60, SLEEP, WAKE, false)).toBe(HOUR_AFTER_WAKE_GREETINGS);
    expect(greetingBank(8 * 60 + 1, SLEEP, WAKE, false)).toBe(EARLY_MORNING_GREETINGS);
  });

  test('inside the overnight sleep window', () => {
    expect(greetingBank(23 * 60, SLEEP, WAKE, false)).toBe(SHOULD_BE_SLEEPING_GREETINGS);
    expect(greetingBank(3 * 60, SLEEP, WAKE, false)).toBe(SHOULD_BE_SLEEPING_GREETINGS);
  });

  test('time-of-day fallbacks', () => {
    expect(greetingBank(10 * 60, SLEEP, WAKE, false)).toBe(MORNING_GREETINGS);
    expect(greetingBank(13 * 60, SLEEP, WAKE, false)).toBe(AFTERNOON_GREETINGS);
    expect(greetingBank(18 * 60, SLEEP, WAKE, false)).toBe(EVENING_GREETINGS);
    // 20:30 is 90 min before the 22:00 bedtime: plain night bank
    expect(greetingBank(20 * 60 + 30, SLEEP, WAKE, false)).toBe(NIGHT_GREETINGS);
  });

  test('night fallback outside the special windows', () => {
    // 20:30 with a 23:30 bedtime: not within an hour of bed, not sleeping window
    expect(greetingBank(20 * 60 + 30, 23 * 60 + 30, WAKE, false)).toBe(NIGHT_GREETINGS);
  });
});

describe('shuffle', () => {
  test('avoids repeating the current greeting when possible', () => {
    // a deterministic random cycling through the bank
    let i = 0;
    const random = () => {
      i = (i + 1) % 7;
      return i / 10;
    };
    const bank = greetingBank(13 * 60, SLEEP, WAKE, false);
    const current = bank[1];
    const next = getShuffledGreeting(current, 13 * 60, SLEEP, WAKE, false, random);
    expect(next).not.toBe(current);
    expect(bank).toContain(next);
  });
});
