import type { SleepSession } from '@/domain/models';

import { buildSleepLogRows, formatLogDuration } from './sleep-log-rows';

function session(overrides: Partial<SleepSession>): SleepSession {
  return {
    id: 'session-1',
    tag: 'Manual Log',
    startTime: new Date('2026-07-15T05:30:00.000Z'),
    endTime: new Date('2026-07-15T13:00:00.000Z'),
    startTimeZone: 'America/Edmonton',
    endTimeZone: 'America/Edmonton',
    createdAt: new Date('2026-07-15T13:05:00.000Z'),
    updatedAt: new Date('2026-07-15T13:05:00.000Z'),
    ...overrides,
  };
}

describe('sleep log rows', () => {
  it('formats rows using the wake day, session times, and duration badge', () => {
    const rows = buildSleepLogRows([
      session({
        id: 'overnight',
        startTime: new Date('2026-07-15T05:30:00.000Z'),
        endTime: new Date('2026-07-15T13:00:00.000Z'),
      }),
    ]);

    expect(rows).toEqual([
      {
        id: 'overnight',
        wakeDayKey: '2026-07-15',
        dayLabel: 'Wed 15 Jul',
        startLabel: '11:30 PM',
        endLabel: '7:00 AM',
        durationLabel: '7h 30m',
      },
    ]);
  });

  it('hides invalid sub-5-minute sessions and sorts remaining rows newest first', () => {
    const rows = buildSleepLogRows([
      session({
        id: 'older',
        startTime: new Date('2026-07-14T06:00:00.000Z'),
        endTime: new Date('2026-07-14T13:00:00.000Z'),
      }),
      session({
        id: 'invalid',
        startTime: new Date('2026-07-16T08:00:00.000Z'),
        endTime: new Date('2026-07-16T08:04:00.000Z'),
      }),
      session({
        id: 'newer',
        startTime: new Date('2026-07-16T06:00:00.000Z'),
        endTime: new Date('2026-07-16T13:00:00.000Z'),
      }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(['newer', 'older']);
  });

  it('does not depend on Array.prototype.toSorted for Hermes compatibility', () => {
    const originalToSorted = Array.prototype.toSorted;

    try {
      // eslint-disable-next-line no-extend-native -- simulates hermes missing tosorted
      Array.prototype.toSorted = undefined as never;

      const rows = buildSleepLogRows([
        session({
          id: 'valid',
          startTime: new Date('2026-07-16T06:00:00.000Z'),
          endTime: new Date('2026-07-16T13:00:00.000Z'),
        }),
      ]);

      expect(rows.map((row) => row.id)).toEqual(['valid']);
    } finally {
      // eslint-disable-next-line no-extend-native -- restores the test environment
      Array.prototype.toSorted = originalToSorted;
    }
  });

  it('formats sleep log durations without seconds', () => {
    expect(formatLogDuration(6 * 3600 + 36 * 60 + 59)).toBe('6h 36m');
  });
});
