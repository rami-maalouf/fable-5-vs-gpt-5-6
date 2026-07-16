// ports behavior of: Utils/StrategyManager.swift (short-session messages)
import { pluralizedTimeString, shortSleepJoke, SHORT_SLEEP_JOKES } from '../jokes';

describe('pluralizedTimeString', () => {
  test('sub-minute durations use seconds', () => {
    expect(pluralizedTimeString(1)).toBe('1 second');
    expect(pluralizedTimeString(45)).toBe('45 seconds');
  });

  test('minute durations pluralize correctly', () => {
    expect(pluralizedTimeString(60)).toBe('1 minute');
    expect(pluralizedTimeString(179)).toBe('2 minutes');
    expect(pluralizedTimeString(299)).toBe('4 minutes');
  });
});

describe('shortSleepJoke', () => {
  test('there are exactly 7 messages', () => {
    expect(SHORT_SLEEP_JOKES).toHaveLength(7);
  });

  test('interpolates the pluralized time into the chosen message', () => {
    expect(shortSleepJoke(120, 0)).toBe('Did you really have a 2 minutes sleep? 🤨');
    expect(shortSleepJoke(60, 6)).toBe('You call 1 minute a sleep? I call it a blink ⚡️');
  });

  test('random pick stays inside the bank', () => {
    for (let i = 0; i < 20; i++) {
      const joke = shortSleepJoke(90);
      expect(joke).toContain('1 minute');
    }
  });
});
