// ports: twilight/views/sleepmetricsview.swift

import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MetricsChartCard } from '@/components/charts/MetricsChartCard';
import { createWeekdayAndHistogramModel } from '@/components/charts/metrics-chart-models';
import type { SleepNightRecord } from '@/domain/metrics/core';
import { useTheme } from '@/theme/ThemeProvider';

const plotHeight = 150;

export function WeekdayAveragesChart({ records }: { records: readonly SleepNightRecord[] }) {
  const { theme } = useTheme();
  const model = useMemo(() => createWeekdayAndHistogramModel(records), [records]);
  return (
    <MetricsChartCard
      subtitle="Highlights weekday vs weekend rhythm and where drift starts."
      title="Average Sleep by Day of Week"
    >
      <View accessibilityLabel="Average sleep by weekday chart" style={styles.chartFrame}>
        <YAxis labels={['12h', '6h', '0h']} />
        <View style={styles.plot}>
          <GridLines />
          <View style={styles.barRow}>
            {model.weekdays.map((day) => {
              const weekend = day.weekday === 1 || day.weekday === 7;
              return (
                <View accessibilityLabel={`${day.dayName}, ${day.averageHours.toFixed(1)} hours`} key={day.weekday} style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor: weekend ? '#af52de' : theme.actionPrimary,
                        height: Math.max(day.averageHours > 0 ? 2 : 0, (day.averageHours / 12) * plotHeight),
                      },
                    ]}
                  />
                  <Text style={[styles.dayLabel, { color: theme.textPrimary }]}>{day.dayName}</Text>
                  <Text style={[styles.dayValue, { color: theme.textSecondary }]}>{day.averageHours.toFixed(1)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </MetricsChartCard>
  );
}

export function DurationHistogramChart({ records }: { records: readonly SleepNightRecord[] }) {
  const { theme } = useTheme();
  const model = useMemo(() => createWeekdayAndHistogramModel(records), [records]);
  const maximum = Math.max(1, ...model.buckets.map((bucket) => bucket.count));
  return (
    <MetricsChartCard
      subtitle="How often your nights fall into each duration band."
      title="Duration Distribution"
    >
      <View accessibilityLabel="Sleep duration histogram" style={styles.histogram}>
        {model.buckets.map((bucket) => (
          <View accessibilityLabel={`${bucket.label}, ${bucket.shareLabel}`} key={bucket.label} style={styles.histogramColumn}>
            <Text style={[styles.share, { color: theme.textSecondary }]}>{bucket.shareLabel}</Text>
            <View
              style={[
                styles.histogramBar,
                { backgroundColor: theme.accent, height: (bucket.count / maximum) * 120 },
              ]}
            />
            <Text numberOfLines={2} style={[styles.bucketLabel, { color: theme.textSecondary }]}>{bucket.label}</Text>
          </View>
        ))}
      </View>
    </MetricsChartCard>
  );
}

function YAxis({ labels }: { labels: readonly string[] }) {
  const { theme } = useTheme();
  return (
    <View style={styles.yAxis}>
      {labels.map((label) => <Text key={label} style={[styles.yLabel, { color: theme.textSecondary }]}>{label}</Text>)}
    </View>
  );
}

function GridLines() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[0, 0.5, 1].map((position) => <View key={position} style={[styles.gridLine, { top: `${position * 100}%` }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: 4, opacity: 0.8, width: 24 },
  barColumn: { alignItems: 'center', flex: 1, height: plotHeight + 34, justifyContent: 'flex-end' },
  barRow: { alignItems: 'flex-end', flexDirection: 'row', height: plotHeight + 34 },
  bucketLabel: { fontSize: 7, lineHeight: 9, marginTop: 5, minHeight: 18, textAlign: 'center' },
  chartFrame: { flexDirection: 'row', height: plotHeight + 34 },
  dayLabel: { fontSize: 10, fontWeight: '800', marginTop: 5 },
  dayValue: { fontSize: 8, fontWeight: '600', marginTop: 1 },
  gridLine: { backgroundColor: 'rgba(255,255,255,0.1)', height: 1, left: 0, position: 'absolute', right: 0 },
  histogram: { alignItems: 'flex-end', flexDirection: 'row', height: 165 },
  histogramBar: { borderRadius: 4, minHeight: 1, opacity: 0.8, width: 20 },
  histogramColumn: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  plot: { flex: 1, height: plotHeight, position: 'relative' },
  share: { fontSize: 8, fontWeight: '700', marginBottom: 4 },
  yAxis: { height: plotHeight, justifyContent: 'space-between', paddingRight: 7, width: 30 },
  yLabel: { fontSize: 9, fontWeight: '700' },
});
