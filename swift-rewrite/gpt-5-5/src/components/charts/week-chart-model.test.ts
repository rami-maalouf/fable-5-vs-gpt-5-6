import type { SleepSettings } from '@/domain/models';
import { defaultSleepSettings } from '@/domain/models';
import type { SleepNightRecord } from '@/domain/metrics/core';

import {
  buildWeekChartData,
  buildWeekChartRules,
  buildWeekChartStats,
  calculateWeekChartDomain,
  clockMinutesToOffsetHours,
  deviationColor,
  deviationMinutes,
  formatDeviation,
  formatWeekDuration,
  offsetHoursToClockLabel,
} from './week-chart-model';

const settings: SleepSettings = {
  ...defaultSleepSettings,
  optimalSleepMinutes: 30,
  optimalWakeMinutes: 7 * 60 + 30,
};

function record(dateKey: string, durationHours: number, bedtimeOffsetHours: number, wakeOffsetHours: number): SleepNightRecord {
  return {
    bedtimeOffsetHours,
    date: new Date(`${dateKey}T12:00:00.000Z`),
    dateKey,
    durationHours,
    midpointOffsetHours: bedtimeOffsetHours + durationHours / 2,
    sessionId: dateKey,
    wakeOffsetHours,
    weekday: new Date(`${dateKey}T12:00:00.000Z`).getUTCDay() + 1,
  };
}

describe('week chart model', () => {
  it('matches the Swift 18:00 offset model', () => {
    expect(clockMinutesToOffsetHours(30)).toBe(6.5);
    expect(clockMinutesToOffsetHours(7 * 60 + 30)).toBe(13.5);
    expect(offsetHoursToClockLabel(6)).toBe('12 AM');
    expect(formatWeekDuration(6.57)).toBe('6.6h');
  });

  it('builds a seven-day chart anchored to the latest tracked night', () => {
    const records = [
      record('2026-07-14', 6.9, 7.92, 14.83),
      record('2026-07-16', 6.6, 8.92, 15.5),
    ];
    const data = buildWeekChartData(records, settings, new Date('2026-07-30T12:00:00.000Z'));

    expect(data.map((datum) => datum.dateKey)).toEqual([
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
      '2026-07-14',
      '2026-07-15',
      '2026-07-16',
    ]);
    expect(data[4]).toMatchObject({
      durationLabel: '6.9h',
      sleepChartY: -7.92,
      wakeChartY: -14.83,
    });
    expect(data[5].durationLabel).toBe('--');
  });

  it('builds rules and stats from the existing metric engine', () => {
    const records = [
      record('2026-07-14', 6.9, 7.92, 14.83),
      record('2026-07-15', 7.0, 6.5, 13.5),
      record('2026-07-16', 6.6, 8.92, 15.5),
    ];
    const domain = calculateWeekChartDomain(records, settings);
    const rules = buildWeekChartRules(settings, domain);
    const stats = buildWeekChartStats(records, settings);

    expect(domain).toEqual({
      bottom: -15.5,
      maxOffsetHours: 15.5,
      minOffsetHours: 6.5,
      top: -6.5,
    });
    expect(rules.map((rule) => rule.label)).toEqual(['12:30 AM', '7:30 AM', '7.0h']);
    expect(stats.averageDurationHours).toBe(6.8);
    expect(stats.accuracy).toBeGreaterThan(0);
  });

  it('formats selection deviations with the Swift thresholds', () => {
    const colors = { accent: '#00d4ff', success: '#00ff88', warning: '#ff6b35' };

    expect(deviationMinutes(7, 6.5)).toBe(30);
    expect(formatDeviation(30)).toBe('30m late');
    expect(formatDeviation(-75)).toBe('1h 15m early');
    expect(deviationColor(10, colors)).toBe(colors.success);
    expect(deviationColor(30, colors)).toBe(colors.warning);
    expect(deviationColor(45, colors)).toBe(colors.accent);
  });
});
