import { averageDuration, type SleepNightRecord } from '@/domain/metrics/core';

const chartDomainTop = 12;
const minutesPerHour = 60;
const successThresholdHours = 15 / minutesPerHour;
const warningThresholdHours = 31 / minutesPerHour;
const floatingPointTolerance = 1e-9;
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export type DeviationBand = 'success' | 'warning' | 'accent';

export interface WeekChartDatum extends Record<string, unknown> {
  bedtimeChartHour: number;
  day: string;
  dayKey: string;
  durationHours: number;
  durationLabel: string;
  index: number;
  wakeChartHour: number;
}

export interface WeekChartRule {
  chartHour: number;
  label: string;
}

export interface WeekChartModel {
  data: WeekChartDatum[];
  rules: {
    duration: WeekChartRule;
    sleep: WeekChartRule;
    wake: WeekChartRule;
  };
}

export function createWeekChartModel(
  records: readonly SleepNightRecord[],
  targetSleepOffset: number,
  targetWakeOffset: number,
): WeekChartModel {
  const recent = records.slice(-7);
  const durationHours = averageDuration(recent) ?? 0;
  const sleepChartHour = offsetToChartHour(targetSleepOffset);
  const wakeChartHour = offsetToChartHour(targetWakeOffset);
  return {
    data: recent.map((record, index) => ({
      bedtimeChartHour: offsetToChartHour(record.bedtimeOffset),
      day: weekdays[record.weekday - 1] ?? '',
      dayKey: record.dayKey,
      durationHours: record.durationHours,
      durationLabel: `${record.durationHours.toFixed(1)}h`,
      index,
      wakeChartHour: offsetToChartHour(record.wakeOffset),
    })),
    rules: {
      duration: { chartHour: durationHours, label: `${durationHours.toFixed(1)}h` },
      sleep: { chartHour: sleepChartHour, label: formatChartClock(sleepChartHour) },
      wake: { chartHour: wakeChartHour, label: formatChartClock(wakeChartHour) },
    },
  };
}

export function deviationBand(durationHours: number, targetDurationHours: number): DeviationBand {
  const deviation = Math.abs(durationHours - targetDurationHours);
  if (deviation <= successThresholdHours + floatingPointTolerance) return 'success';
  if (deviation <= warningThresholdHours + floatingPointTolerance) return 'warning';
  return 'accent';
}

export function shouldHideClockTick(tick: number, annotatedRules: readonly number[]): boolean {
  return annotatedRules.some(
    (rule) => Math.abs(rule - tick) <= warningThresholdHours + floatingPointTolerance,
  );
}

export function formatChartClock(chartHour: number): string {
  const minutesAfterMidnight = Math.round((chartDomainTop - chartHour) * minutesPerHour);
  const normalizedMinutes = ((minutesAfterMidnight % 1440) + 1440) % 1440;
  const hour = Math.floor(normalizedMinutes / minutesPerHour);
  const minute = normalizedMinutes % minutesPerHour;
  const displayHour = hour % 12 || 12;
  return `${displayHour}${minute === 0 ? '' : `:${String(minute).padStart(2, '0')}`} ${hour < 12 ? 'AM' : 'PM'}`;
}

function offsetToChartHour(offset: number): number {
  return 18 - offset;
}
