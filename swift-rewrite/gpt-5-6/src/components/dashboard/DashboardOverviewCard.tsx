import { StyleSheet, Text, View } from 'react-native';

import { AlignmentCard } from '@/components/charts/AlignmentCard';
import { MovingAverageCard } from '@/components/charts/MovingAverageCard';
import { WeekChart } from '@/components/charts/WeekChart';
import { CardBackground } from '@/components/common/card-background';
import { InsightPills, type InsightPillModel } from '@/components/dashboard/InsightPills';
import type { DashboardViewMode } from '@/components/dashboard/SegmentedPicker';
import {
  scheduleAccuracyScore,
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
  const insights = mode === 'week' || mode === 'average'
    ? createInsights(
        mode,
        recent,
        records,
        targetDurationHours,
        targetSleepOffset,
        targetWakeOffset,
        theme,
      )
    : null;
  return (
    <CardBackground style={styles.card}>
      {insights ? <InsightPills items={insights} /> : null}
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
        mode="score"
        records={records}
        targetDurationHours={targetDurationHours}
        targetSleepOffset={targetSleepOffset}
      />
    );
  }
  return (
    <AlignmentCard
      mode="core"
      records={records}
      targetDurationHours={targetDurationHours}
      targetSleepOffset={targetSleepOffset}
    />
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
  return [];
}

function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, minHeight: 248, padding: 14 },
  emptyCopy: { fontSize: 13, lineHeight: 19, marginTop: 7, maxWidth: 250, textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  preview: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingTop: 8 },
});
