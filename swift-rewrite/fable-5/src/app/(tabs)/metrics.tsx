// ports: Views/SleepMetricsView.swift - the metrics tab
// range picker (30D/90D/1Y/All), overview + highlights + regularity stat
// grids, duration momentum, trends analysis, rolling consistency, rolling
// components with filter, sleep debt, weekday averages, histogram, footer
// tiles, toolbar (timeline + guide)
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { SegmentedPicker } from '@/components/dashboard/SegmentedPicker';
import {
  ComponentsChart,
  DebtChart,
  HistogramChart,
  MomentumChart,
  REGULARITY_COMPONENTS,
  RollingConsistencyChart,
  WeekdayChart,
  type RegularityComponentKey,
} from '@/components/charts/metrics-charts';
import { formatAbbrevDate } from '@/components/charts/date-scale';
import {
  ChartCard,
  MetricChip,
  MetricsEmptyState,
  MultiStatCard,
  SectionTitle,
  type StatItem,
} from '@/components/metrics/primitives';
import { TrendsCard } from '@/components/metrics/TrendsCard';
import { SleepMetricsAnalyzer, type MetricsRange } from '@/domain/metrics/analyzer';
import type { CalendarDay } from '@/domain/models';
import { zonedParts } from '@/domain/session-rules';
import { useSleepStore } from '@/state/app-sleep-store';
import { useSettings } from '@/state/settings-state';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';

const RANGES: MetricsRange[] = ['30D', '90D', '1Y', 'All'];
const FILTERS = ['All', 'Bedtime', 'Wake', 'Accuracy'] as const;
type Filter = (typeof FILTERS)[number];

const TEAL = '#30b0c7';
const INDIGO = '#5856d6';
const ORANGE = '#ff9500';
const GREEN = '#34c759';
const RED = '#ff3b30';
const YELLOW = '#ffcc00';
const PURPLE = '#af52de';
const GRAY = '#8e8e93';

function todayDay(): CalendarDay {
  const p = zonedParts(Date.now(), Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC');
  return { year: p.year, month: p.month, day: p.day };
}

function fmtHours(v: number | null): string {
  if (v == null) return '-';
  const totalMinutes = Math.round(v * 60);
  return `${Math.trunc(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function fmtSignedHours(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}h`;
}

export default function MetricsScreen() {
  const theme = useTheme();
  const fixed = useFixedColor();
  const { width } = useWindowDimensions();
  const sessions = useSleepStore((s) => s.sessions);
  const refresh = useSleepStore((s) => s.refresh);
  const optimalSleepMinutes = useSettings((s) => s.optimalSleepMinutes);
  const optimalWakeMinutes = useSettings((s) => s.optimalWakeMinutes);

  const [range, setRange] = useState<MetricsRange>('90D');
  const [filter, setFilter] = useState<Filter>('All');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const data = useMemo(() => {
    const analyzer = new SleepMetricsAnalyzer(sessions, {
      optimalSleepMinutes,
      optimalWakeMinutes,
      today: todayDay(),
    });
    const records = analyzer.recordsIn(range);
    const consistencySeries = analyzer.rollingConsistencySeries(records, 14);
    const composite = consistencySeries.flatMap((p) =>
      p.sleepConsistency != null && p.wakeConsistency != null && p.scheduleAccuracy != null
        ? [
            {
              date: p.date,
              score: Math.round((p.sleepConsistency + p.wakeConsistency + p.scheduleAccuracy) / 3),
            },
          ]
        : []
    );
    return {
      analyzer,
      records,
      movingAverage: analyzer.movingAverageSeries(records, 7),
      consistencySeries,
      composite,
      debtSeries: analyzer.cumulativeDebtSeries(records),
      weekdayAverages: analyzer.weekdayAverages(records),
      buckets: analyzer.durationBuckets(records),
      trends: analyzer.durationTrendsAnalysis(),
    };
  }, [sessions, optimalSleepMinutes, optimalWakeMinutes, range]);

  const { analyzer, records } = data;

  // ports regularityDomain: rounded-decade bounds with a minimum 30pt span
  const regularityDomain = useMemo(() => {
    const values = data.consistencySeries.flatMap((p) =>
      [p.sleepConsistency, p.wakeConsistency, p.scheduleAccuracy].filter(
        (v): v is number => v != null
      )
    );
    if (values.length === 0) return { lower: 0, upper: 100 };
    let lower = Math.max(0, Math.floor(Math.min(...values) / 10) * 10 - 10);
    let upper = Math.min(100, Math.ceil(Math.max(...values) / 10) * 10 + 10);
    if (upper - lower < 30) {
      const midpoint = (upper + lower) / 2;
      lower = Math.max(0, midpoint - 15);
      upper = Math.min(100, midpoint + 15);
    }
    return { lower, upper };
  }, [data.consistencySeries]);

  const debt = analyzer.cumulativeDebtHours(records);
  const chartWidth = width - 20 * 2 - 16 * 2;

  const overviewStats: StatItem[] = [
    { title: 'Tracked Nights', valueText: `${records.length}`, icon: 'moon.stars.fill', iconColor: theme.actionPrimary },
    { title: 'Data Coverage', valueText: `${analyzer.trackingCoverage(records, range)}%`, icon: 'chart.bar.xaxis', iconColor: fixed(TEAL) },
    { title: 'Average Duration', valueText: fmtHours(analyzer.averageDuration(records)), icon: 'clock.fill', iconColor: fixed(GREEN) },
    { title: 'Goal Hit Rate', valueText: `${analyzer.goalHitRate(records)}%`, icon: 'target', iconColor: fixed(ORANGE) },
    { title: 'Current Streak', valueText: `${analyzer.currentStreak()} days`, icon: 'flame.fill', iconColor: fixed(RED) },
    { title: 'Best Streak', valueText: `${analyzer.longestStreak()} days`, icon: 'crown.fill', iconColor: fixed(YELLOW) },
  ];

  const highlightStats: StatItem[] = [
    { title: 'Longest Night', valueText: fmtHours(analyzer.longestNight(records)), icon: 'arrow.up.circle.fill', iconColor: fixed(GREEN) },
    { title: 'Shortest Night', valueText: fmtHours(analyzer.shortestNight(records)), icon: 'arrow.down.circle.fill', iconColor: fixed(ORANGE) },
    { title: 'Total Sleep', valueText: fmtHours(analyzer.totalSleepHours(records)), icon: 'bed.double.fill', iconColor: theme.actionPrimary },
    { title: 'Debt / Credit', valueText: fmtSignedHours(debt), icon: 'scale.3d', iconColor: debt >= 0 ? fixed(GREEN) : fixed(RED) },
  ];

  const jetlag = analyzer.socialJetlagHours(records);
  const regularityStats: StatItem[] = [
    { title: 'Regularity Score', valueText: `${analyzer.regularityScore(records)}%`, icon: 'waveform.path.ecg', iconColor: fixed(INDIGO) },
    { title: 'Bedtime Consistency', valueText: `${analyzer.sleepConsistencyScore(records)}%`, icon: 'moon.fill', iconColor: fixed(INDIGO) },
    { title: 'Wake Consistency', valueText: `${analyzer.wakeConsistencyScore(records)}%`, icon: 'sunrise.fill', iconColor: fixed(ORANGE) },
    { title: 'Schedule Accuracy', valueText: `${analyzer.scheduleAccuracyScore(records)}%`, icon: 'scope', iconColor: fixed(GREEN) },
    { title: 'Social Jetlag', valueText: jetlag == null ? '-' : `${jetlag.toFixed(1)}h`, icon: 'calendar.badge.exclamationmark', iconColor: fixed(PURPLE) },
    { title: 'Debt / Credit', valueText: fmtSignedHours(debt), icon: 'scale.3d', iconColor: debt >= 0 ? fixed(GREEN) : fixed(RED) },
  ];

  const nerdStats: StatItem[] = [
    { title: 'Range Start', valueText: analyzer.firstTrackedDate ? formatAbbrevDate(analyzer.firstTrackedDate) : '-', icon: 'calendar', iconColor: GRAY },
    { title: 'Total Data Range', valueText: `${analyzer.dataRangeDays} days`, icon: 'calendar.badge.clock', iconColor: GRAY },
    { title: 'All-Time Nights', valueText: `${analyzer.records.length}`, icon: 'moon.stars', iconColor: GRAY },
    { title: 'Tag', valueText: 'Sleep', icon: 'number.square', iconColor: GRAY },
  ];

  const latest = (get: (p: (typeof data.consistencySeries)[number]) => number | null) => {
    for (let i = data.consistencySeries.length - 1; i >= 0; i--) {
      const v = get(data.consistencySeries[i]);
      if (v != null) return `${v}%`;
    }
    return '-';
  };

  const displayedComponents: RegularityComponentKey[] =
    filter === 'All'
      ? REGULARITY_COMPONENTS.map((c) => c.key)
      : [filter.toLowerCase() as RegularityComponentKey];

  const weekdayAvg = avgFor(new Set([2, 3, 4, 5, 6]));
  const weekendAvg = avgFor(new Set([1, 7]));
  function avgFor(days: Set<number>): number | null {
    const values = records.filter((r) => days.has(r.weekday)).map((r) => r.durationHours);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Metrics</Text>
          <View style={styles.toolbar}>
            <Pressable testID="timeline-button" onPress={() => router.push('/timeline-sheet')} hitSlop={6}>
              <SymbolView name="chart.bar.xaxis" size={20} tintColor={theme.textPrimary} />
            </Pressable>
            <Pressable testID="guide-button" onPress={() => router.push('/metrics-explanation')} hitSlop={6}>
              <SymbolView name="info.circle" size={20} tintColor={theme.textPrimary} />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Long-range sleep intelligence from your full history: momentum, regularity, recovery,
          and behavior patterns.
        </Text>

        <View style={styles.pickerRow}>
          <SegmentedPicker options={RANGES} value={range} onChange={setRange} />
        </View>

        {records.length === 0 ? (
          <MetricsEmptyState />
        ) : (
          <>
            <SectionTitle title="Overview" />
            <MultiStatCard stats={overviewStats} />

            <SectionTitle title="Highlights" />
            <MultiStatCard stats={highlightStats} />

            <SectionTitle title="Duration Momentum" />
            <ChartCard
              title="Daily Duration + 7-Night Moving Average"
              subtitle="Bars are each tracked night. Line smooths short-term noise.">
              <MomentumChart
                series={data.movingAverage}
                targetDurationHours={analyzer.targetDurationHours}
                width={chartWidth}
              />
            </ChartCard>

            <View style={styles.chipRow}>
              <MetricChip
                title="Recent 7-night trend"
                value={fmtTrend(analyzer.durationTrendPercent(records))}
              />
              <MetricChip title="Median duration" value={fmtHours(analyzer.medianDuration(records))} />
            </View>

            <TrendsCard
              periods={data.trends}
              lastDate={analyzer.records.length > 0 ? analyzer.records[analyzer.records.length - 1].date : null}
            />

            <SectionTitle title="Regularity" />
            <MultiStatCard stats={regularityStats} />

            <View style={styles.chipRow}>
              <MetricChip title="Latest bedtime" value={latest((p) => p.sleepConsistency)} />
              <MetricChip title="Latest wake" value={latest((p) => p.wakeConsistency)} />
            </View>
            <View style={styles.chipRow}>
              <MetricChip title="Latest accuracy" value={latest((p) => p.scheduleAccuracy)} />
              <MetricChip
                title="Latest rolling score"
                value={data.composite.length > 0 ? `${data.composite[data.composite.length - 1].score}%` : '-'}
              />
            </View>

            <ChartCard
              title="Rolling Consistency Score"
              subtitle="Single score trend (average of sleep consistency, wake consistency, and accuracy).">
              <RollingConsistencyChart points={data.composite} domain={regularityDomain} width={chartWidth} />
            </ChartCard>

            <ChartCard
              title="Rolling 14-Night Components"
              subtitle="Clean component view with optional filtering for readability.">
              <View style={styles.componentsBody}>
                <SegmentedPicker options={FILTERS} value={filter} onChange={setFilter} />
                <View style={styles.legendRow}>
                  {REGULARITY_COMPONENTS.filter((c) => displayedComponents.includes(c.key)).map((c) => (
                    <View key={c.key} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: fixed(c.color) }]} />
                      <Text style={[styles.legendText, { color: theme.textSecondary }]}>{c.title}</Text>
                    </View>
                  ))}
                </View>
                <ComponentsChart
                  series={data.consistencySeries}
                  components={displayedComponents}
                  domain={regularityDomain}
                  width={chartWidth}
                />
              </View>
            </ChartCard>

            <SectionTitle title="Recovery" />
            <ChartCard
              title="Cumulative Sleep Debt / Credit"
              subtitle="Tracks running surplus or deficit against your goal duration.">
              <DebtChart series={data.debtSeries} width={chartWidth} />
            </ChartCard>

            <SectionTitle title="Behavior Patterns" />
            <ChartCard
              title="Average Sleep by Day of Week"
              subtitle="Highlights weekday vs weekend rhythm and where drift starts.">
              <WeekdayChart averages={data.weekdayAverages} width={chartWidth} />
            </ChartCard>

            <View style={styles.chipRow}>
              <MetricChip title="Weekday avg" value={fmtHours(weekdayAvg)} />
              <MetricChip title="Weekend avg" value={fmtHours(weekendAvg)} />
            </View>

            <ChartCard
              title="Duration Distribution"
              subtitle="How often your nights fall into each duration band.">
              <HistogramChart buckets={data.buckets} width={chartWidth} />
            </ChartCard>

            <MultiStatCard stats={nerdStats} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function fmtTrend(percent: number | null): string {
  if (percent == null) return '-';
  const rounded = Math.round(percent);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

const styles = StyleSheet.create({
  content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 130, gap: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 34, fontWeight: '700' },
  toolbar: { flexDirection: 'row', gap: 18 },
  description: { fontSize: 15 },
  pickerRow: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row', gap: 8 },
  componentsBody: { gap: 10 },
  legendRow: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12 },
});
