// ports behavior of: Views/SleepDataModels.swift (SleepDataUtils)
import {
  BASE_HOUR,
  calculateYAxisDomain,
  formatDurationHm,
  formatDurationShort,
  formatTimeLabel,
  normalizedDurationY,
  timeOffsetFromMinutes,
  timeOffsetOfInstant,
} from '../chart-data';

describe('time offsets (18:00 base hour)', () => {
  test('base hour is 18:00', () => {
    expect(BASE_HOUR).toBe(18);
  });

  test('22:00 is 4 hours after base', () => {
    expect(timeOffsetFromMinutes(22 * 60)).toBe(4);
  });

  test('hours before 18:00 wrap to the next day (07:30 -> 13.5)', () => {
    expect(timeOffsetFromMinutes(7 * 60 + 30)).toBe(13.5);
  });

  test('00:30 crossing midnight sorts after 23:00', () => {
    expect(timeOffsetFromMinutes(30)).toBeGreaterThan(timeOffsetFromMinutes(23 * 60));
  });

  test('instant offsets are computed in the given timezone', () => {
    // 2025-01-15 06:30 utc = 23:30 jan 14 denver
    expect(timeOffsetOfInstant(Date.UTC(2025, 0, 15, 6, 30), 'America/Denver')).toBe(5.5);
  });
});

describe('y-axis domain (calculateYAxisDomain)', () => {
  test('empty data defaults to 10pm-8am (4..14)', () => {
    expect(calculateYAxisDomain([], null, null)).toEqual({ min: 4, max: 14 });
  });

  test('domain spans data and optimal offsets tightly', () => {
    const data = [
      { startOffset: 5, endOffset: 13.5, durationSeconds: 8.5 * 3600 },
      { startOffset: 4.5, endOffset: 12, durationSeconds: 7.5 * 3600 },
    ];
    // optimal sleep 22:00 (offset 4), wake 09:00 (offset 15)
    expect(calculateYAxisDomain(data, 22 * 60, 9 * 60)).toEqual({ min: 4, max: 15 });
  });

  test('zero-duration (empty) days are excluded from the domain', () => {
    const data = [
      { startOffset: 0, endOffset: 0, durationSeconds: 0 },
      { startOffset: 5, endOffset: 13, durationSeconds: 8 * 3600 },
    ];
    expect(calculateYAxisDomain(data, null, null)).toEqual({ min: 5, max: 13 });
  });
});

describe('normalizedDurationY', () => {
  test('maps 0..12h onto the negated domain', () => {
    // domain min 4, max 14 -> top = -4, bottom = -14, range 10
    expect(normalizedDurationY(0, 4, 14)).toBe(-14);
    expect(normalizedDurationY(12, 4, 14)).toBe(-4);
    expect(normalizedDurationY(6, 4, 14)).toBe(-9);
  });
});

describe('labels', () => {
  test('formatTimeLabel maps offsets back to clock labels', () => {
    expect(formatTimeLabel(0)).toBe('6 PM');
    expect(formatTimeLabel(6)).toBe('12 AM');
    expect(formatTimeLabel(13.5)).toBe('7 AM');
    expect(formatTimeLabel(18)).toBe('12 PM');
  });

  test('formatDurationShort renders decimal hours', () => {
    expect(formatDurationShort(6.9 * 3600)).toBe('6.9');
    expect(formatDurationShort(8 * 3600)).toBe('8.0');
  });

  test('formatDurationHm matches the abbreviated hour+minute style', () => {
    expect(formatDurationHm(6 * 3600 + 36 * 60)).toBe('6h 36min');
    expect(formatDurationHm(7 * 3600)).toBe('7h');
    expect(formatDurationHm(45 * 60)).toBe('45min');
  });
});
