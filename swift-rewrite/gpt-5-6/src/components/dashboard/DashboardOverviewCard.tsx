import { StyleSheet, Text, View } from 'react-native';

import { AlignmentCard } from '@/components/charts/AlignmentCard';
import { MovingAverageCard } from '@/components/charts/MovingAverageCard';
import { WeekChart } from '@/components/charts/WeekChart';
import { CardBackground } from '@/components/common/card-background';
import { InsightPills, type InsightPillModel } from '@/components/dashboard/InsightPills';
import type { DashboardViewMode } from '@/components/dashboard/SegmentedPicker';
import {
  regularityScore,
  scheduleAccuracyScore,
  sleepAlignmentSeries,
  sleepConsistencyScore,
  wakeConsistencyScore,
} from '@/domain/metrics/advanced';
import {
  averageDuration,
  durationTrendPercent,
  movingAverageSeries,
  type SleepNightRecord,
} from '@/domain/metrics/core';
import { useTheme } from '@/theme/ThemeProvider';

export function DashboardOverviewCard({
  mode,
  records,
  targetDurationHours,
  targetSleepOffset,
  targetWakeOffset,
}: {
  mode: DashboardViewMode;
  records: readonly SleepNightRecord[];
  targetDurationHours: number;
  targetSleepOffset: number;
  targetWakeOffset: number;
}) {
  const { theme } = useTheme();
  const recent = records.slice(-7);
  const insights = createInsights(
    mode,
    recent,
    records,
    targetDurationHours,
    targetSleepOffset,
    targetWakeOffset,
    theme,
  );
  return (
    <CardBackground style={styles.card}>
      <InsightPills items={insights} />
      <View style={styles.preview}>
        {records.length === 0 ? (
          <>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Your sleep story starts tonight</Text>
            <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>Track a night to reveal rhythms, averages, and scores.</Text>
          </>
        ) : (
          <ModePreview
            mode={mode}
            records={records}
            targetDurationHours={targetDurationHours}
            targetSleepOffset={targetSleepOffset}
            targetWakeOffset={targetWakeOffset}
          />
        )}
      </View>
    </CardBackground>
  );
}

function ModePreview({
  mode,
  records,
  targetDurationHours,
  targetSleepOffset,
  targetWakeOffset,
}: {
  mode: DashboardViewMode;
  records: readonly SleepNightRecord[];
  targetDurationHours: number;
  targetSleepOffset: number;
  targetWakeOffset: number;
}) {
  if (mode === 'week') {
    return (
      <WeekChart
        records={records}
        targetDurationHours={targetDurationHours}
        targetSleepOffset={targetSleepOffset}
        targetWakeOffset={targetWakeOffset}
      />
    );
  }
  if (mode === 'average') {
    return <MovingAverageCard records={records} targetDurationHours={targetDurationHours} />;
  }
  if (mode === 'score') {
    return (
      <AlignmentCard
        records={records}
        targetDurationHours={targetDurationHours}
        targetSleepOffset={targetSleepOffset}
      />
    );
  }
  const alignment = sleepAlignmentSeries(records, targetDurationHours, targetSleepOffset).at(-1);
  const coreScore = alignment
    ? Math.round((alignment.durationScore * 100 + regularityScore(records)) / 2)
    : null;
  return <PreviewNumber label="core sleep score" value={coreScore === null ? 'Not enough nights' : `${coreScore}`} />;
}

function PreviewNumber({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.numberPreview}>
      <Text style={[styles.previewNumber, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function createInsights(
  mode: DashboardViewMode,
  recent: readonly SleepNightRecord[],
  all: readonly SleepNightRecord[],
  targetDurationHours: number,
  targetSleepOffset: number,
  targetWakeOffset: number,
  theme: ReturnType<typeof useTheme>['theme'],
): InsightPillModel[] {
  const average = averageDuration(recent);
  const sleepConsistency = sleepConsistencyScore(recent);
  const wakeConsistency = wakeConsistencyScore(recent);
  const accuracy = scheduleAccuracyScore(recent, targetSleepOffset, targetWakeOffset);
  if (mode === 'week') {
    const hasRecentNights = recent.length > 0;
    return [
      { color: theme.actionPrimary, subtitle: 'last 7 nights', title: 'AVG SLEEP', value: average === null ? '--' : formatHours(average) },
      { color: theme.accent, subtitle: 'bedtime rhythm', title: 'SLEEP CONS.', value: hasRecentNights ? `${sleepConsistency}%` : '--' },
      { color: theme.warning, subtitle: 'wake rhythm', title: 'WAKE CONS.', value: hasRecentNights ? `${wakeConsistency}%` : '--' },
      { color: theme.success, subtitle: 'target match', title: 'ACCURACY', value: hasRecentNights ? `${accuracy}%` : '--' },
    ];
  }
  const alignment = sleepAlignmentSeries(all, targetDurationHours, targetSleepOffset).at(-1);
  if (mode === 'average') {
    const latestAverage = movingAverageSeries(all).at(-1)?.movingAverageHours ?? null;
    const trend = durationTrendPercent(all);
    return [
      { color: theme.actionPrimary, subtitle: 'rolling value', title: '7-NIGHT AVG', value: latestAverage === null ? '--' : formatHours(latestAverage) },
      { color: theme.success, subtitle: 'sleep goal', title: 'TARGET', value: formatHours(targetDurationHours) },
      { color: theme.accent, subtitle: 'tracked', title: 'NIGHTS', value: `${all.length}` },
      { color: trend !== null && trend >= 0 ? theme.success : theme.warning, subtitle: 'vs prior 7', title: 'CHANGE', value: trend === null ? '--' : `${trend >= 0 ? '+' : ''}${Math.round(trend)}%` },
    ];
  }
  if (mode === 'core') {
    return [
      { color: theme.actionPrimary, subtitle: 'goal fit', title: 'DURATION', value: alignment ? `${Math.round(alignment.durationScore * 100)}` : '--' },
      { color: theme.success, subtitle: 'bed + wake', title: 'TIMING', value: alignment ? `${Math.round(alignment.timingScore * 100)}` : '--' },
      { color: theme.accent, subtitle: 'midpoint', title: 'PHASE', value: alignment ? `${Math.round(alignment.phaseScore * 100)}` : '--' },
      { color: theme.warning, subtitle: 'rhythm', title: 'CONSIST.', value: alignment ? `${Math.round(alignment.consistencyScore * 100)}` : '--' },
    ];
  }
  return [
    { color: theme.actionPrimary, subtitle: 'duration', title: 'DAILY', value: alignment ? `${Math.round(alignment.dailyScore)}` : '--' },
    { color: theme.success, subtitle: 'smoothed', title: 'TREND', value: alignment ? `${Math.round(alignment.trendScore)}` : '--' },
    { color: theme.accent, subtitle: 'bed + wake', title: 'TIMING', value: alignment ? `${Math.round(alignment.timingScore * 100)}` : '--' },
    { color: theme.warning, subtitle: 'rhythm', title: 'CONSIST.', value: alignment ? `${Math.round(alignment.consistencyScore * 100)}` : '--' },
  ];
}

function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, minHeight: 248, padding: 14 },
  emptyCopy: { fontSize: 13, lineHeight: 19, marginTop: 7, maxWidth: 250, textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  numberPreview: { alignItems: 'center' },
  preview: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingTop: 8 },
  previewLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  previewNumber: { fontSize: 48, fontWeight: '800' },
});
