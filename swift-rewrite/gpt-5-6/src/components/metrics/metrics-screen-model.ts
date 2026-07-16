// ports: twilight/views/sleepmetricsview.swift

import {
  averageDuration,
  currentStreak,
  goalHitRate,
  longestNight,
  longestStreak,
  recordsInRange,
  shortestNight,
  totalSleepHours,
  trackingCoverage,
  type SleepNightRecord,
} from '@/domain/metrics/core';
import { cumulativeDebtHours } from '@/domain/metrics/advanced';

export const METRICS_RANGES = ['30D', '90D', '1Y', 'All'] as const;

export type MetricsRange = (typeof METRICS_RANGES)[number];

export interface MetricsStat {
  id:
    | 'averageDuration'
    | 'bestStreak'
    | 'currentStreak'
    | 'dataCoverage'
    | 'debtCredit'
    | 'goalHitRate'
    | 'longestNight'
    | 'shortestNight'
    | 'totalSleep'
    | 'trackedNights';
  label: string;
  value: string;
}

interface MetricsScreenModelOptions {
  allRecords: readonly SleepNightRecord[];
  range: MetricsRange;
  referenceDayKey: string;
  targetDurationHours: number;
}

export interface MetricsScreenModel {
  highlights: MetricsStat[];
  isEmpty: boolean;
  overview: MetricsStat[];
  records: SleepNightRecord[];
}

export function rangeDays(range: MetricsRange): number | null {
  switch (range) {
    case '30D':
      return 30;
    case '90D':
      return 90;
    case '1Y':
      return 365;
    case 'All':
      return null;
  }
}

export function buildMetricsScreenModel({
  allRecords,
  range,
  referenceDayKey,
  targetDurationHours,
}: MetricsScreenModelOptions): MetricsScreenModel {
  const days = rangeDays(range);
  const records = recordsInRange(allRecords, days, referenceDayKey);
  const debtCredit = cumulativeDebtHours(records, targetDurationHours);

  return {
    highlights: [
      { id: 'longestNight', label: 'Longest Night', value: formatHours(longestNight(records)) },
      { id: 'shortestNight', label: 'Shortest Night', value: formatHours(shortestNight(records)) },
      { id: 'totalSleep', label: 'Total Sleep', value: formatHours(totalSleepHours(records)) },
      { id: 'debtCredit', label: 'Debt / Credit', value: formatSignedHours(debtCredit) },
    ],
    isEmpty: records.length === 0,
    overview: [
      { id: 'trackedNights', label: 'Tracked Nights', value: String(records.length) },
      {
        id: 'dataCoverage',
        label: 'Data Coverage',
        value: `${trackingCoverage(records, { days, referenceDayKey })}%`,
      },
      { id: 'averageDuration', label: 'Average Duration', value: formatHours(averageDuration(records)) },
      {
        id: 'goalHitRate',
        label: 'Goal Hit Rate',
        value: `${goalHitRate(records, targetDurationHours)}%`,
      },
      {
        id: 'currentStreak',
        label: 'Current Streak',
        value: formatDays(currentStreak(allRecords, referenceDayKey)),
      },
      { id: 'bestStreak', label: 'Best Streak', value: formatDays(longestStreak(allRecords)) },
    ],
    records,
  };
}

function formatDays(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

function formatHours(hours: number | null): string {
  if (hours === null) {
    return '-';
  }
  const totalMinutes = Math.round(hours * 60);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function formatSignedHours(hours: number): string {
  const prefix = hours >= 0 ? '+' : '';
  return `${prefix}${hours.toFixed(1)}h`;
}
