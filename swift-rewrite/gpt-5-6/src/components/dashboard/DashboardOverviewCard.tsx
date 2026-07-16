import { StyleSheet, Text, View } from 'react-native';

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
          <ModePreview mode={mode} records={records} targetDurationHours={targetDurationHours} targetSleepOffset={targetSleepOffset} />
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
}: {
  mode: DashboardViewMode;
  records: readonly SleepNightRecord[];
  targetDurationHours: number;
  targetSleepOffset: number;
}) {
  const { theme } = useTheme();
  if (mode === 'week') {
    return (
      <View style={styles.barRow}>
        {records.slice(-7).map((record) => (
          <View key={record.id} style={styles.barColumn}>
            <View style={[styles.bar, { backgroundColor: theme.actionPrimary, height: Math.max(32, record.durationHours * 10) }]} />
            <Text style={[styles.day, { color: theme.textSecondary }]}>{weekday(record.weekday)}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (mode === 'average') {
    const average = movingAverageSeries(records).at(-1)?.movingAverageHours;
    return <PreviewNumber label="latest 7-night average" value={average === null || average === undefined ? 'Not enough nights' : formatHours(average)} />;
  }
  const score = sleepAlignmentSeries(records, targetDurationHours, targetSleepOffset).at(-1)?.trendScore;
  if (mode === 'score') {
    return <PreviewNumber label="sleep alignment trend" value={score === undefined ? 'Not enough nights' : `${Math.round(score)}`} />;
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

function weekday(value: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][value - 1] ?? '';
}

const styles = StyleSheet.create({
  bar: { borderRadius: 5, width: 24 },
  barColumn: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  barRow: { alignItems: 'flex-end', flexDirection: 'row', gap: 8, height: 128, width: '100%' },
  card: { marginHorizontal: 16, minHeight: 248, padding: 14 },
  day: { fontSize: 10, fontWeight: '700', marginTop: 7 },
  emptyCopy: { fontSize: 13, lineHeight: 19, marginTop: 7, maxWidth: 250, textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  numberPreview: { alignItems: 'center' },
  preview: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingTop: 16 },
  previewLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  previewNumber: { fontSize: 48, fontWeight: '800' },
});
