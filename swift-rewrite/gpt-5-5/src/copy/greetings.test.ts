import {
  greetingBanks,
  getGreeting,
  getShuffledGreeting,
  selectGreetingBank,
} from './greetings';

describe('sleep greetings', () => {
  it('ports the active swift greeting bank counts without emoji glyphs', () => {
    expect(Object.fromEntries(Object.entries(greetingBanks).map(([key, entries]) => [key, entries.length]))).toEqual({
      afternoon: 9,
      currentlySleeping: 10,
      earlyMorning: 11,
      evening: 12,
      hourAfterWake: 10,
      hourBeforeSleep: 11,
      morning: 5,
      night: 10,
      shouldBeSleeping: 10,
    });
    expect(Object.values(greetingBanks).flat().join('')).not.toMatch(/[\u{1f300}-\u{1faff}]/u);
  });

  it('prioritizes active sleeping and schedule-adjacent greeting banks', () => {
    expect(selectGreetingBank({ currentMinutes: 21 * 60 + 30, isSleeping: true, sleepMinutes: 22 * 60, wakeMinutes: 7 * 60 })).toBe(
      'currentlySleeping',
    );
    expect(selectGreetingBank({ currentMinutes: 21 * 60 + 30, sleepMinutes: 22 * 60, wakeMinutes: 7 * 60 })).toBe(
      'hourBeforeSleep',
    );
    expect(selectGreetingBank({ currentMinutes: 7 * 60 + 45, sleepMinutes: 22 * 60, wakeMinutes: 7 * 60 })).toBe(
      'hourAfterWake',
    );
    expect(selectGreetingBank({ currentMinutes: 23 * 60, sleepMinutes: 22 * 60, wakeMinutes: 7 * 60 })).toBe(
      'shouldBeSleeping',
    );
    expect(selectGreetingBank({ currentMinutes: 3 * 60, sleepMinutes: 22 * 60, wakeMinutes: 7 * 60 })).toBe(
      'shouldBeSleeping',
    );
  });

  it('falls back to time-of-day banks outside the sleep window', () => {
    expect(selectGreetingBank({ currentMinutes: 5 * 60 + 1, sleepMinutes: 22 * 60, wakeMinutes: 4 * 60 })).toBe(
      'earlyMorning',
    );
    expect(selectGreetingBank({ currentMinutes: 10 * 60, sleepMinutes: 22 * 60, wakeMinutes: 4 * 60 })).toBe('morning');
    expect(selectGreetingBank({ currentMinutes: 13 * 60, sleepMinutes: 22 * 60, wakeMinutes: 4 * 60 })).toBe('afternoon');
    expect(selectGreetingBank({ currentMinutes: 18 * 60, sleepMinutes: 22 * 60, wakeMinutes: 4 * 60 })).toBe('evening');
    expect(selectGreetingBank({ currentMinutes: 21 * 60, sleepMinutes: 23 * 60, wakeMinutes: 7 * 60 })).toBe('night');
  });

  it('returns stable indexed greetings and can shuffle away from the current one', () => {
    const input = { currentMinutes: 18 * 60, sleepMinutes: 23 * 60, wakeMinutes: 7 * 60 };

    expect(getGreeting(input, 0)).toBe('Good Evening!');
    expect(getGreeting(input, 99)).toBe('Chill Vibes');
    expect(getShuffledGreeting('Good Evening!', input)).not.toBe('Good Evening!');
  });
});
