import type { SleepSettings } from '@/domain/models';
import { goalDurationHours, type SleepNightRecord } from '@/domain/metrics/core';
import {
  scheduleAccuracyScore,
  sleepConsistencyScore,
  targetOffsetsFromMinutes,
  wakeConsistencyScore,
} from '@/domain/metrics/advanced';

export type WeekChartDatum = {
  dateKey: string;
  dayLabel: string;
  durationChartY: number | null;
  durationHours: number;
  durationLabel: string;
  index: number;
  record: SleepNightRecord | null;
  sleepChartY: number | null;
  wakeChartY: number | null;
};

export type WeekChartDomain = {
  bottom: number;
  maxOffsetHours: number;
  minOffsetHours: number;
  top: number;
};

export type WeekChartRule = {
  color: string;
  label: string;
  y: number;
};

export type WeekChartStats = {
  accuracy: number;
  averageDurationHours: number | null;
  sleepConsistency: number;
  wakeConsistency: number;
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;
const baseHour = 18;
const defaultMinOffsetHours = 4;
const defaultMaxOffsetHours = 14;

function roundToTenths(value: number) {
  return Math.round(value * 10) / 10;
}

function dateKeyToDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function dateToDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateKey: string, deltaDays: number) {
  return dateToDateKey(new Date(dateKeyToDate(dateKey).getTime() + deltaDays * millisecondsPerDay));
}

function weekdayLabel(dateKey: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(dateKeyToDate(dateKey));
}

function durationChartY(hours: number, domain: WeekChartDomain) {
  const range = domain.top - domain.bottom;
  return domain.bottom + (hours / 12) * range;
}

function sortedByDate(records: readonly SleepNightRecord[]) {
  return [...records].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

function chartRecords(records: readonly SleepNightRecord[]) {
  return sortedByDate(records).slice(-7);
}

export function clockMinutesToOffsetHours(minutes: number) {
  const normalizedMinutes = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const clockHours = normalizedMinutes / 60;
  return clockHours < baseHour ? clockHours + 24 - baseHour : clockHours - baseHour;
}

export function offsetHoursToClockLabel(offsetHours: number) {
  const clockHour = (baseHour + offsetHours) % 24;
  const roundedHour = Math.round(clockHour);
  const period = roundedHour >= 12 ? 'PM' : 'AM';
  const hour12 = roundedHour % 12 || 12;

  return `${hour12} ${period}`;
}

export function formatWeekDuration(hours: number) {
  return `${roundToTenths(hours).toFixed(1)}h`;
}

export function calculateWeekChartDomain(records: readonly SleepNightRecord[], settings: SleepSettings): WeekChartDomain {
  const targets = targetOffsetsFromMinutes(settings.optimalSleepMinutes, settings.optimalWakeMinutes);
  const activeRecords = records.filter((record) => record.durationHours > 0);
  const offsets = activeRecords.flatMap((record) => [record.bedtimeOffsetHours, record.wakeOffsetHours]);

  offsets.push(targets.targetSleepOffsetHours, targets.targetWakeOffsetHours);

  const minOffsetHours = offsets.length > 0 ? Math.min(...offsets) : defaultMinOffsetHours;
  const maxOffsetHours = offsets.length > 0 ? Math.max(...offsets) : defaultMaxOffsetHours;

  return {
    bottom: -maxOffsetHours,
    maxOffsetHours,
    minOffsetHours,
    top: -minOffsetHours,
  };
}

export function buildWeekChartData(
  records: readonly SleepNightRecord[],
  settings: SleepSettings,
  referenceDate = new Date(),
): WeekChartDatum[] {
  const orderedRecords = sortedByDate(records);
  const latestDateKey = orderedRecords.at(-1)?.dateKey ?? dateToDateKey(referenceDate);
  const firstDateKey = addDays(latestDateKey, -6);
  const byDateKey = new Map(orderedRecords.map((record) => [record.dateKey, record]));
  const domain = calculateWeekChartDomain(chartRecords(records), settings);

  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = addDays(firstDateKey, index);
    const record = byDateKey.get(dateKey) ?? null;
    const durationHours = record?.durationHours ?? 0;

    return {
      dateKey,
      dayLabel: weekdayLabel(dateKey),
      durationChartY: record ? durationChartY(record.durationHours, domain) : null,
      durationHours,
      durationLabel: record ? formatWeekDuration(record.durationHours) : '--',
      index,
      record,
      sleepChartY: record ? -record.bedtimeOffsetHours : null,
      wakeChartY: record ? -record.wakeOffsetHours : null,
    };
  });
}

export function buildWeekChartRules(settings: SleepSettings, domain: WeekChartDomain): WeekChartRule[] {
  const targets = targetOffsetsFromMinutes(settings.optimalSleepMinutes, settings.optimalWakeMinutes);

  return [
    {
      color: '#7B68EE',
      label: formatClockMinutes(settings.optimalSleepMinutes),
      y: -targets.targetSleepOffsetHours,
    },
    {
      color: '#FFB347',
      label: formatClockMinutes(settings.optimalWakeMinutes),
      y: -targets.targetWakeOffsetHours,
    },
    {
      color: 'rgba(255,255,255,0.72)',
      label: `${goalDurationHours(settings.optimalSleepMinutes, settings.optimalWakeMinutes).toFixed(1)}h`,
      y: durationChartY(goalDurationHours(settings.optimalSleepMinutes, settings.optimalWakeMinutes), domain),
    },
  ];
}

export function buildWeekChartStats(records: readonly SleepNightRecord[], settings: SleepSettings): WeekChartStats {
  const activeRecords = chartRecords(records).filter((record) => record.durationHours > 0);
  const totalDurationHours = activeRecords.reduce((sum, record) => sum + record.durationHours, 0);
  const targets = targetOffsetsFromMinutes(settings.optimalSleepMinutes, settings.optimalWakeMinutes);

  return {
    accuracy: scheduleAccuracyScore(activeRecords, targets),
    averageDurationHours: activeRecords.length > 0 ? roundToTenths(totalDurationHours / activeRecords.length) : null,
    sleepConsistency: sleepConsistencyScore(activeRecords),
    wakeConsistency: wakeConsistencyScore(activeRecords),
  };
}

export function deviationMinutes(actualOffsetHours: number, targetOffsetHours: number) {
  return Math.round((actualOffsetHours - targetOffsetHours) * 60);
}

export function formatDeviation(minutes: number) {
  if (minutes === 0) {
    return 'On target';
  }

  const absoluteMinutes = Math.abs(minutes);
  const amount =
    absoluteMinutes >= 60
      ? `${Math.floor(absoluteMinutes / 60)}h ${absoluteMinutes % 60}m`
      : `${absoluteMinutes}m`;

  return `${amount} ${minutes > 0 ? 'late' : 'early'}`;
}

export function deviationColor(minutes: number, colors: { accent: string; success: string; warning: string }) {
  const absoluteMinutes = Math.abs(minutes);

  if (absoluteMinutes <= 15) {
    return colors.success;
  }

  if (absoluteMinutes <= 31) {
    return colors.warning;
  }

  return colors.accent;
}

function formatClockMinutes(minutes: number) {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}
