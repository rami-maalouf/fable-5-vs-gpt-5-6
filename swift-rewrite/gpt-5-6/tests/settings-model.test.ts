import {
  dateFromMinutesSinceMidnight,
  formatGoalDuration,
  minutesSinceMidnightFromDate,
  SETTINGS_MODE_OPTIONS,
} from '@/components/settings/settings-model';

describe('settings model', () => {
  it('converts native picker dates to minutes since midnight', () => {
    const date = new Date(2026, 6, 16, 22, 35, 42, 900);

    expect(minutesSinceMidnightFromDate(date)).toBe(22 * 60 + 35);
  });

  it('creates stable local picker dates from stored minutes', () => {
    const date = dateFromMinutesSinceMidnight(7 * 60 + 15);

    expect(date.getFullYear()).toBe(2001);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(7);
    expect(date.getMinutes()).toBe(15);
  });

  it('normalizes out-of-range minute values', () => {
    expect(dateFromMinutesSinceMidnight(-15).getHours()).toBe(23);
    expect(dateFromMinutesSinceMidnight(-15).getMinutes()).toBe(45);
    expect(dateFromMinutesSinceMidnight(24 * 60 + 30).getHours()).toBe(0);
    expect(dateFromMinutesSinceMidnight(24 * 60 + 30).getMinutes()).toBe(30);
  });

  it('formats overnight goal durations', () => {
    expect(formatGoalDuration(22 * 60, 7 * 60)).toBe('Goal: 9 hr');
    expect(formatGoalDuration(22 * 60 + 30, 7 * 60 + 15)).toBe('Goal: 8 hr 45 min');
  });

  it('maps the original display labels to persisted theme modes', () => {
    expect(SETTINGS_MODE_OPTIONS).toEqual([
      { label: 'System', value: 'system' },
      { label: 'Sunset', value: 'light' },
      { label: 'Night', value: 'dark' },
    ]);
  });
});
