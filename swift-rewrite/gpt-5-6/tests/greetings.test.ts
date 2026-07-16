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
} from '../src/copy/greetings';

const sleepMinutes = 22 * 60;
const wakeMinutes = 7 * 60;

describe('sleep greeting selection', () => {
  it('pins all nine active copy banks', () => {
    expect([
      EARLY_MORNING_GREETINGS.length,
      MORNING_GREETINGS.length,
      AFTERNOON_GREETINGS.length,
      EVENING_GREETINGS.length,
      NIGHT_GREETINGS.length,
      HOUR_BEFORE_SLEEP_GREETINGS.length,
      HOUR_AFTER_WAKE_GREETINGS.length,
      SHOULD_BE_SLEEPING_GREETINGS.length,
      CURRENTLY_SLEEPING_GREETINGS.length,
    ]).toEqual([11, 5, 9, 12, 10, 11, 10, 10, 10]);
  });

  it('prioritizes active sleep and the before-bed and after-wake windows', () => {
    expect(greetingBank(13 * 60, sleepMinutes, wakeMinutes, true)).toBe(CURRENTLY_SLEEPING_GREETINGS);
    expect(greetingBank(21 * 60, sleepMinutes, wakeMinutes, false)).toBe(HOUR_BEFORE_SLEEP_GREETINGS);
    expect(greetingBank(7 * 60, sleepMinutes, wakeMinutes, false)).toBe(HOUR_AFTER_WAKE_GREETINGS);
    expect(greetingBank(8 * 60, sleepMinutes, wakeMinutes, false)).toBe(HOUR_AFTER_WAKE_GREETINGS);
  });

  it('selects the sleep window before time-of-day fallbacks', () => {
    expect(greetingBank(22 * 60, sleepMinutes, wakeMinutes, false)).toBe(SHOULD_BE_SLEEPING_GREETINGS);
    expect(greetingBank(3 * 60, sleepMinutes, wakeMinutes, false)).toBe(SHOULD_BE_SLEEPING_GREETINGS);
    expect(greetingBank(8 * 60 + 1, sleepMinutes, wakeMinutes, false)).toBe(EARLY_MORNING_GREETINGS);
    expect(greetingBank(10 * 60, sleepMinutes, wakeMinutes, false)).toBe(MORNING_GREETINGS);
    expect(greetingBank(13 * 60, sleepMinutes, wakeMinutes, false)).toBe(AFTERNOON_GREETINGS);
    expect(greetingBank(18 * 60, sleepMinutes, wakeMinutes, false)).toBe(EVENING_GREETINGS);
    expect(greetingBank(20 * 60 + 30, sleepMinutes, wakeMinutes, false)).toBe(NIGHT_GREETINGS);
  });

  it('tries to avoid repeating the visible greeting when shuffled', () => {
    const bank = greetingBank(13 * 60, sleepMinutes, wakeMinutes, false);
    let index = 0;
    const next = getShuffledGreeting(bank[0], 13 * 60, sleepMinutes, wakeMinutes, false, () => {
      index += 1;
      return index / 10;
    });
    expect(bank).toContain(next);
    expect(next).not.toBe(bank[0]);
  });
});
