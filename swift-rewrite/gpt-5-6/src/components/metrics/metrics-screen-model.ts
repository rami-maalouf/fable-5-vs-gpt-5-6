// ports: twilight/views/sleepmetricsview.swift

import {
  averageDuration,
  currentStreak,
  durationTrendPercent,
  goalHitRate,
  longestNight,
  longestStreak,
  medianDuration,
  movingAverageSeries,
  recordsInRange,
  shortestNight,
  totalSleepHours,
  trackingCoverage,
  type SleepNightRecord,
} from '@/domain/metrics/core';
import {
  cumulativeDebtHours,
  regularityScore,
  rollingConsistencySeries,
  scheduleAccuracyScore,
  sleepConsistencyScore,
  socialJetlagHours,
  wakeConsistencyScore,
} from '@/domain/metrics/advanced';

export const METRICS_RANGES = ['30D', '90D', '1Y', 'All'] as const;

export type MetricsRange = (typeof METRICS_RANGES)[number];

export interface MetricsStat {
  id:
    | 'averageDuration'
    | 'bedtimeConsistency'
    | 'bestStreak'
    | 'currentStreak'
    | 'dataCoverage'
    | 'debtCredit'
    | 'goalHitRate'
    | 'longestNight'
    | 'rangeStart'
    | 'regularityScore'
    | 'scheduleAccuracy'
    | 'shortestNight'
    | 'socialJetlag'
    | 'totalDataRange'
    | 'totalSleep'
    | 'trackedNights'
    | 'wakeConsistency';
  label: string;
  value: string;
}

interface MetricsScreenModelOptions {
  allRecords: readonly SleepNightRecord[];
  range: MetricsRange;
  referenceDayKey: string;
  targetDurationHours: number;
  targetSleepOffset?: number | null;
  targetWakeOffset?: number | null;
}

export interface MetricsTrendPeriod {
  average: string;
  change: string;
  days: number;
  sparkline: number[];
}

export interface MetricsChipPair {
  left: { label: string; value: string };
  right: { label: string; value: string };
}

export interface MetricsScreenModel {
  highlights: MetricsStat[];
  behaviorSummary: { weekdayAverage: string; weekendAverage: string };
  footer: MetricsStat[];
  isEmpty: boolean;
  momentumSummary: { medianDuration: string; recentTrend: string };
  overview: MetricsStat[];
  records: SleepNightRecord[];
  regularity: {
    latest: { accuracy: string; bedtime: string; rollingScore: string; wake: string };
    stats: MetricsStat[];
  };
  trends: MetricsTrendPeriod[];
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
  targetSleepOffset = null,
  targetWakeOffset = null,
}: MetricsScreenModelOptions): MetricsScreenModel {
  const days = rangeDays(range);
  const records = recordsInRange(allRecords, days, referenceDayKey);
  const debtCredit = cumulativeDebtHours(records, targetDurationHours);
  const rolling = rollingConsistencySeries(records, targetSleepOffset, targetWakeOffset);
  const latestRolling = rolling.findLast((point) => point.sleepConsistency !== null);
  const weekdayRecords = records.filter((record) => record.weekday >= 2 && record.weekday <= 6);
  const weekendRecords = records.filter((record) => record.weekday === 1 || record.weekday === 7);
  const firstRecord = allRecords[0];

  return {
    behaviorSummary: {
      weekdayAverage: formatHours(averageDuration(weekdayRecords)),
      weekendAverage: formatHours(averageDuration(weekendRecords)),
    },
    footer: [
      {
        id: 'rangeStart',
        label: 'Range Start',
        value: firstRecord ? formatDate(firstRecord.date) : '-',
      },
      {
        id: 'totalDataRange',
        label: 'Total Data Range',
        value: `${firstRecord ? daysInclusive(firstRecord.dayKey, referenceDayKey) : 0} days`,
      },
    ],
    highlights: [
      { id: 'longestNight', label: 'Longest Night', value: formatHours(longestNight(records)) },
      { id: 'shortestNight', label: 'Shortest Night', value: formatHours(shortestNight(records)) },
      { id: 'totalSleep', label: 'Total Sleep', value: formatHours(totalSleepHours(records)) },
      { id: 'debtCredit', label: 'Debt / Credit', value: formatSignedHours(debtCredit) },
    ],
    isEmpty: records.length === 0,
    momentumSummary: {
      medianDuration: formatHours(medianDuration(records)),
      recentTrend: formatTrend(durationTrendPercent(records)),
    },
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
    regularity: {
      latest: {
        accuracy: formatPercent(latestRolling?.scheduleAccuracy ?? null),
        bedtime: formatPercent(latestRolling?.sleepConsistency ?? null),
        rollingScore: formatPercent(compositeScore(latestRolling)),
        wake: formatPercent(latestRolling?.wakeConsistency ?? null),
      },
      stats: [
        {
          id: 'regularityScore',
          label: 'Regularity Score',
          value: `${regularityScore(records)}%`,
        },
        {
          id: 'bedtimeConsistency',
          label: 'Bedtime Consistency',
          value: `${sleepConsistencyScore(records)}%`,
        },
        {
          id: 'wakeConsistency',
          label: 'Wake Consistency',
          value: `${wakeConsistencyScore(records)}%`,
        },
        {
          id: 'scheduleAccuracy',
          label: 'Schedule Accuracy',
          value: `${scheduleAccuracyScore(records, targetSleepOffset, targetWakeOffset)}%`,
        },
        {
          id: 'socialJetlag',
          label: 'Social Jetlag',
          value: formatHoursCompact(socialJetlagHours(records)),
        },
        { id: 'debtCredit', label: 'Debt / Credit', value: formatSignedHours(debtCredit) },
      ],
    },
    trends: buildTrendPeriods(allRecords),
  };
}

function buildTrendPeriods(records: readonly SleepNightRecord[]): MetricsTrendPeriod[] {
  const dailyValues = records.map((record) => record.durationHours);
  const rollingValues = movingAverageSeries(records)
    .flatMap((point) => point.movingAverageHours === null ? [] : [point.movingAverageHours]);
  return [3, 7, 14, 30, 90].map((days) => {
    const current = records.slice(-days);
    const previous = records.slice(-days * 2, -days);
    const currentAverage = averageDuration(current);
    const previousAverage = averageDuration(previous);
    const change = currentAverage !== null && previousAverage !== null && previousAverage > 0
      ? ((currentAverage - previousAverage) / previousAverage) * 100
      : null;
    return {
      average: formatHours(currentAverage),
      change: formatTrend(change),
      days,
      sparkline: (days <= 14 ? dailyValues : rollingValues).slice(-days),
    };
  });
}

function compositeScore(point: ReturnType<typeof rollingConsistencySeries>[number] | undefined): number | null {
  if (
    !point
    || point.sleepConsistency === null
    || point.wakeConsistency === null
    || point.scheduleAccuracy === null
  ) {
    return null;
  }
  return Math.round(
    (point.sleepConsistency + point.wakeConsistency + point.scheduleAccuracy) / 3,
  );
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

function formatHoursCompact(hours: number | null): string {
  return hours === null ? '-' : `${hours.toFixed(1)}h`;
}

function formatPercent(value: number | null): string {
  return value === null ? '-' : `${value}%`;
}

function formatTrend(value: number | null): string {
  if (value === null) {
    return '-';
  }
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}

function daysInclusive(startDayKey: string, endDayKey: string): number {
  const start = Date.parse(`${startDayKey}T00:00:00Z`);
  const end = Date.parse(`${endDayKey}T00:00:00Z`);
  return Math.floor((end - start) / (24 * 60 * 60 * 1_000)) + 1;
}
