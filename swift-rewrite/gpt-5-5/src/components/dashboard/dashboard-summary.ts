import type { SleepSettings, SleepSession } from '@/domain/models';
import {
  averageDurationHours,
  buildNightRecords,
  currentStreak,
  durationTrendPercent,
  goalHitRate,
  movingAverageSeries,
  recordsInRange,
  trackingCoverage,
  type SleepNightRecord,
} from '@/domain/metrics/core';
import {
  regularityScore,
  scheduleAccuracyScore,
  sleepAlignmentSeries,
  targetOffsetsFromMinutes,
} from '@/domain/metrics/advanced';

export type DashboardRange = '90D' | 'All';

export type DashboardSummary = {
  alignmentScore: number | null;
  averageDurationHours: number | null;
  coveragePercent: number;
  dayOverDayPercent: number | null;
  goalHitRatePercent: number;
  lastNight: SleepNightRecord | null;
  movingAverageHours: number | null;
  previousNight: SleepNightRecord | null;
  range: DashboardRange;
  rangeRecords: SleepNightRecord[];
  scheduleAccuracy: number;
  sleepRegularity: number;
  streakDays: number;
  targetDurationHours: number;
  trendPercent: number | null;
};

type DashboardSummaryInput = {
  range: DashboardRange;
  referenceDate?: Date;
  sessions: readonly SleepSession[];
  settings: SleepSettings;
};

function sortedByDate(records: readonly SleepNightRecord[]) {
  return [...records].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

function lastNonNullMovingAverage(records: readonly SleepNightRecord[]) {
  const point = [...movingAverageSeries(records)].reverse().find((entry) => entry.movingAverageHours != null);
  return point?.movingAverageHours ?? null;
}

function latestAlignmentScore(records: readonly SleepNightRecord[], settings: SleepSettings) {
  const targets = targetOffsetsFromMinutes(settings.optimalSleepMinutes, settings.optimalWakeMinutes);
  const point = sleepAlignmentSeries(records, targets).at(-1);

  if (!point) {
    return null;
  }

  return Math.round(point.trendScore);
}

function calculateDayOverDayPercent(latest: SleepNightRecord | null, previous: SleepNightRecord | null) {
  if (!latest || !previous || previous.durationHours <= 0) {
    return null;
  }

  return Math.round(((latest.durationHours - previous.durationHours) / previous.durationHours) * 100);
}

export function buildDashboardSummary({
  range,
  referenceDate = new Date(),
  sessions,
  settings,
}: DashboardSummaryInput): DashboardSummary {
  const allRecords = sortedByDate(buildNightRecords(sessions));
  const rangeRecords = recordsInRange(allRecords, range, referenceDate);
  const latestRecord = allRecords.at(-1) ?? null;
  const previousRecord = allRecords.at(-2) ?? null;
  const targets = targetOffsetsFromMinutes(settings.optimalSleepMinutes, settings.optimalWakeMinutes);

  return {
    alignmentScore: latestAlignmentScore(rangeRecords, settings),
    averageDurationHours: averageDurationHours(rangeRecords),
    coveragePercent: trackingCoverage(rangeRecords, range, { allRecords, referenceDate }),
    dayOverDayPercent: calculateDayOverDayPercent(latestRecord, previousRecord),
    goalHitRatePercent: goalHitRate(rangeRecords, targets.targetDurationHours),
    lastNight: latestRecord,
    movingAverageHours: lastNonNullMovingAverage(rangeRecords),
    previousNight: previousRecord,
    range,
    rangeRecords,
    scheduleAccuracy: scheduleAccuracyScore(rangeRecords, targets),
    sleepRegularity: regularityScore(rangeRecords),
    streakDays: currentStreak(allRecords, referenceDate),
    targetDurationHours: targets.targetDurationHours,
    trendPercent: durationTrendPercent(rangeRecords),
  };
}

export function formatDurationHours(hours: number | null) {
  if (hours == null) {
    return 'No data';
  }

  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes === 0 ? `${wholeHours}h` : `${wholeHours}h ${minutes}m`;
}

export function formatChangePercent(percent: number | null) {
  if (percent == null) {
    return 'No prior night';
  }

  return `${percent > 0 ? '+' : ''}${percent}% vs prior`;
}

export function formatScore(score: number | null) {
  return score == null ? '--' : String(Math.round(score));
}

export function formatClockMinutes(minutes: number) {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}
