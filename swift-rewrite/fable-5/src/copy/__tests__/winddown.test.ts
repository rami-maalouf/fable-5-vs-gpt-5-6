// ports behavior of: Utils/WindDownNotificationManager.swift
import { WIND_DOWN_MESSAGES, WIND_DOWN_TITLE, windDownReminderTime } from '../winddown';

describe('wind-down reminder', () => {
  test('title and 10 messages, verbatim bank', () => {
    expect(WIND_DOWN_TITLE).toBe('Wind Down Time 🌙');
    expect(WIND_DOWN_MESSAGES).toHaveLength(10);
  });

  test('fires 3 hours before bedtime, preserving minutes', () => {
    expect(windDownReminderTime(22 * 60)).toEqual({ hour: 19, minute: 0 });
    expect(windDownReminderTime(23 * 60 + 45)).toEqual({ hour: 20, minute: 45 });
  });

  test('wraps past midnight (01:30 bedtime -> 22:30 reminder)', () => {
    expect(windDownReminderTime(1 * 60 + 30)).toEqual({ hour: 22, minute: 30 });
  });
});
