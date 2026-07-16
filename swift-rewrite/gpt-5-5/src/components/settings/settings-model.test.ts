import { defaultSleepSettings } from '@/domain/models';

import {
  formatGoalDurationLabel,
  formatSettingsClockTime,
  updateSleepGoal,
} from './settings-model';

describe('settings model', () => {
  it('formats settings clock labels in twelve-hour time', () => {
    expect(formatSettingsClockTime(0)).toBe('12:00 AM');
    expect(formatSettingsClockTime(7 * 60 + 30)).toBe('7:30 AM');
    expect(formatSettingsClockTime(12 * 60)).toBe('12:00 PM');
    expect(formatSettingsClockTime(22 * 60 + 5)).toBe('10:05 PM');
  });

  it('formats the sleep goal across midnight', () => {
    expect(formatGoalDurationLabel(23 * 60, 6 * 60)).toBe('Goal: 7 hr');
    expect(formatGoalDurationLabel(22 * 60 + 30, 7 * 60)).toBe('Goal: 8 hr 30 min');
    expect(formatGoalDurationLabel(1 * 60, 8 * 60)).toBe('Goal: 7 hr');
  });

  it('updates only the sleep goal settings', () => {
    expect(updateSleepGoal(defaultSleepSettings, { sleepMinutes: 23 * 60, wakeMinutes: 6 * 60 })).toEqual({
      ...defaultSleepSettings,
      optimalSleepMinutes: 23 * 60,
      optimalWakeMinutes: 6 * 60,
    });
  });
});
