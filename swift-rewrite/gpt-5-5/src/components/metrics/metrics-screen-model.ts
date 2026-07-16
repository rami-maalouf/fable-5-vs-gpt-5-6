import type { SleepSettings, SleepSession } from '@/domain/models';
import {
  averageDurationHours,
  buildNightRecords,
  currentStreak,
  goalHitRate,
  longestNight,
  medianDurationHours,
  recordsInRange,
  totalSleepHours,
  trackingCoverage,
  type MetricsRange,
  type SleepNightRecord,
} from '@/domain/metrics/core';
import {
  cumulativeDebtHours,
  regularityScore,
  scheduleAccuracyScore,
  sleepAlignmentSeries,
  socialJetlagHours,
  targetOffsetsFromMinutes,
} from '@/domain/metrics/advanced';

export type { MetricsRange };

export type MetricsCardModel = {
  label: string;
  supporting: string;
  tone: 'accent' | 'neutral' | 'success' | 'warning';
  value: string;
};

export type MetricsScreenModel = {
  allRecords: SleepNightRecord[];
  footerTiles: { label: string; value: string }[];
  highlights: MetricsCardModel[];
  isEmpty: boolean;
  overviewCards: MetricsCardModel[];
  range: MetricsRange;
  rangeRecords: SleepNightRecord[];
};

type MetricsScreenModelInput = {
  range: MetricsRange;
  referenceDate?: Date;
  sessions: readonly SleepSession[];
  settings: SleepSettings;
};

function formatDurationHours(hours: number | null) {
  if (hours == null) {
    return 'No data';
  }

  const sign = hours < 0 ? '-' : '';
  const totalMinutes = Math.abs(Math.round(hours * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes === 0 ? `${sign}${wholeHours}h` : `${sign}${wholeHours}h ${minutes}m`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatScore(score: number | null) {
  return score == null ? '0' : String(Math.round(score));
}

function formatNightCount(count: number) {
  return `${count} ${count === 1 ? 'night' : 'nights'}`;
}

function latestAlignmentScore(records: readonly SleepNightRecord[], settings: SleepSettings) {
  const targets = targetOffsetsFromMinutes(settings.optimalSleepMinutes, settings.optimalWakeMinutes);
  const latest = sleepAlignmentSeries(records, targets).at(-1);
  return latest ? Math.round(latest.trendScore) : null;
}

function rangeStartLabel(records: readonly SleepNightRecord[]) {
  return records.at(0)?.dateKey ?? 'No data';
}

function debtTone(debtHours: number) {
  if (debtHours >= 0) {
    return 'success';
  }

  return debtHours <= -3 ? 'warning' : 'neutral';
}

export function buildMetricsScreenModel({
  range,
  referenceDate = new Date(),
  sessions,
  settings,
}: MetricsScreenModelInput): MetricsScreenModel {
  const allRecords = buildNightRecords(sessions).sort((left, right) => left.dateKey.localeCompare(right.dateKey));
  const rangeRecords = recordsInRange(allRecords, range, referenceDate);
  const targets = targetOffsetsFromMinutes(settings.optimalSleepMinutes, settings.optimalWakeMinutes);
  const averageSleep = averageDurationHours(rangeRecords);
  const goalRate = goalHitRate(rangeRecords, targets.targetDurationHours);
  const alignmentScore = latestAlignmentScore(rangeRecords, settings);
  const coverage = trackingCoverage(rangeRecords, range, { allRecords, referenceDate });
  const longest = longestNight(rangeRecords);
  const streak = currentStreak(allRecords, referenceDate);
  const debt = cumulativeDebtHours(rangeRecords, targets.targetDurationHours);
  const socialJetlag = socialJetlagHours(rangeRecords);

  return {
    allRecords,
    footerTiles: [
      { label: 'range start', value: rangeStartLabel(rangeRecords) },
      { label: 'tracked range', value: formatNightCount(rangeRecords.length) },
    ],
    highlights: [
      {
        label: 'longest night',
        supporting: longest ? longest.dateKey : 'Track a night to compare range highs.',
        tone: 'accent',
        value: formatDurationHours(longest?.durationHours ?? null),
      },
      {
        label: 'current streak',
        supporting: 'Consecutive wake days with a valid session.',
        tone: streak > 0 ? 'success' : 'neutral',
        value: formatNightCount(streak),
      },
      {
        label: 'sleep debt',
        supporting: 'Cumulative range delta against your sleep goal.',
        tone: debtTone(debt),
        value: formatDurationHours(debt),
      },
      {
        label: 'social jetlag',
        supporting: 'Weekend versus weekday midpoint drift.',
        tone: socialJetlag == null || socialJetlag < 1 ? 'neutral' : 'warning',
        value: socialJetlag == null ? 'No data' : formatDurationHours(socialJetlag),
      },
    ],
    isEmpty: rangeRecords.length === 0,
    overviewCards: [
      {
        label: 'average sleep',
        supporting: `median ${formatDurationHours(medianDurationHours(rangeRecords))}`,
        tone: 'accent',
        value: formatDurationHours(averageSleep),
      },
      {
        label: 'goal hit rate',
        supporting: `target ${formatDurationHours(targets.targetDurationHours)}`,
        tone: goalRate >= 70 ? 'success' : 'neutral',
        value: formatPercent(goalRate),
      },
      {
        label: 'alignment',
        supporting: `${regularityScore(rangeRecords)} regularity · ${scheduleAccuracyScore(rangeRecords, targets)} accuracy`,
        tone: alignmentScore != null && alignmentScore >= 70 ? 'success' : 'neutral',
        value: formatScore(alignmentScore),
      },
      {
        label: 'coverage',
        supporting: `${formatNightCount(rangeRecords.length)} · ${formatDurationHours(totalSleepHours(rangeRecords))} total`,
        tone: coverage >= 70 ? 'success' : 'neutral',
        value: formatPercent(coverage),
      },
    ],
    range,
    rangeRecords,
  };
}
