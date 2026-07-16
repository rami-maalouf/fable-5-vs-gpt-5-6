import type { SleepSettings, SleepSession } from '@/domain/models';
import { defaultSleepSettings } from '@/domain/models';

import { buildDashboardSummary, formatChangePercent, formatClockMinutes, formatDurationHours } from './dashboard-summary';

const settings: SleepSettings = {
  ...defaultSleepSettings,
  optimalSleepMinutes: 22 * 60,
  optimalWakeMinutes: 7 * 60,
};

function session(id: string, startIso: string, endIso: string): SleepSession {
  const now = new Date(startIso);

  return {
    createdAt: now,
    endTime: new Date(endIso),
    endTimeZone: 'UTC',
    id,
    startTime: new Date(startIso),
    startTimeZone: 'UTC',
    updatedAt: new Date(endIso),
  };
}

describe('dashboard summary', () => {
  it('builds last-night status, streak, and range metrics from valid sessions', () => {
    const summary = buildDashboardSummary({
      range: '90D',
      referenceDate: new Date('2026-07-16T12:00:00.000Z'),
      sessions: [
        session('first', '2026-07-13T22:30:00.000Z', '2026-07-14T06:30:00.000Z'),
        session('second', '2026-07-14T22:00:00.000Z', '2026-07-15T07:00:00.000Z'),
        session('third', '2026-07-15T23:00:00.000Z', '2026-07-16T06:30:00.000Z'),
      ],
      settings,
    });

    expect(summary.lastNight?.sessionId).toBe('third');
    expect(summary.previousNight?.sessionId).toBe('second');
    expect(summary.averageDurationHours).toBe(8.17);
    expect(summary.dayOverDayPercent).toBe(-17);
    expect(summary.streakDays).toBe(3);
    expect(summary.goalHitRatePercent).toBe(33);
    expect(summary.rangeRecords).toHaveLength(3);
  });

  it('formats dashboard values for compact cards', () => {
    expect(formatDurationHours(7.5)).toBe('7h 30m');
    expect(formatDurationHours(null)).toBe('No data');
    expect(formatChangePercent(8)).toBe('+8% vs prior');
    expect(formatChangePercent(null)).toBe('No prior night');
    expect(formatClockMinutes(22 * 60 + 5)).toBe('10:05 PM');
  });
});
