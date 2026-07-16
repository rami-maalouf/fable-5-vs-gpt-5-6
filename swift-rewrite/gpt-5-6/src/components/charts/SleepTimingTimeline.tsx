// ports: twilight/views/sleepmetricsview.swift

import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { createTimingTimelineModel } from '@/components/charts/metrics-chart-models';
import type { SleepNightRecord } from '@/domain/metrics/core';
import { useTheme } from '@/theme/ThemeProvider';

const bedtimeColor = '#7b68ee';
const wakeColor = '#ff9f0a';
const rowHeight = 27;

export function SleepTimingTimeline({
  records,
  targetSleepOffset,
  targetWakeOffset,
}: {
  records: readonly SleepNightRecord[];
  targetSleepOffset: number;
  targetWakeOffset: number;
}) {
  const { theme } = useTheme();
  const model = useMemo(
    () => createTimingTimelineModel(records, targetSleepOffset, targetWakeOffset),
    [records, targetSleepOffset, targetWakeOffset],
  );
  const height = Math.max(360, model.points.length * rowHeight);
  const position = (value: number) => `${((value - model.domain[0]) / (model.domain[1] - model.domain[0])) * 100}%` as `${number}%`;

  return (
    <>
      <View style={styles.pills}>
        <TargetPill color={bedtimeColor} label="Target Bed" value={formatTimelineTime(model.targetSleepOffset, true)} />
        <TargetPill color={wakeColor} label="Target Wake" value={formatTimelineTime(model.targetWakeOffset, true)} />
      </View>
      <View accessibilityLabel="Sleep and wake timing timeline" style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <View style={[styles.timeline, { height }]}>
          <View style={styles.dateColumn}>
            {model.points.map((point) => (
              <Text key={point.dayKey} style={[styles.date, { color: theme.textSecondary }]}>
                {formatDate(point.date)}
              </Text>
            ))}
          </View>
          <View style={styles.plot}>
            <View style={[styles.targetRule, { backgroundColor: bedtimeColor, left: position(model.targetSleepOffset) }]} />
            <View style={[styles.targetRule, { backgroundColor: wakeColor, left: position(model.targetWakeOffset) }]} />
            {model.points.map((point) => {
              const left = position(point.bedtimeOffset);
              const rightPercent = ((point.wakeOffset - model.domain[0]) / (model.domain[1] - model.domain[0])) * 100;
              const leftPercent = ((point.bedtimeOffset - model.domain[0]) / (model.domain[1] - model.domain[0])) * 100;
              return (
                <View accessibilityLabel={`${formatDate(point.date)}, bedtime ${formatTimelineTime(point.bedtimeOffset, true)}, wake ${formatTimelineTime(point.wakeOffset, true)}`} key={point.dayKey} style={styles.row}>
                  <View style={[styles.sleepBar, { backgroundColor: theme.actionPrimary, left, width: `${rightPercent - leftPercent}%` }]} />
                  <View style={[styles.point, { backgroundColor: bedtimeColor, left }]} />
                  <View style={[styles.point, { backgroundColor: wakeColor, left: position(point.wakeOffset) }]} />
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.axis}>
          {axisTicks(model.domain).map((tick) => (
            <Text key={tick} style={[styles.axisLabel, { color: theme.textSecondary }]}>{formatTimelineTime(tick, false)}</Text>
          ))}
        </View>
      </View>
    </>
  );
}

function TargetPill({ color, label, value }: { color: string; label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: theme.cardBackground }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color: theme.textPrimary }]}>{label}: {value}</Text>
    </View>
  );
}

function axisTicks(domain: [number, number]): number[] {
  return Array.from({ length: 4 }, (_, index) => domain[0] + (index / 3) * (domain[1] - domain[0]));
}

function formatTimelineTime(offset: number, includesMinutes: boolean): string {
  const absoluteMinutes = Math.round((18 + offset) * 60);
  const wrapped = ((absoluteMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  return includesMinutes
    ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    : String(hour);
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'short' }).format(timestamp);
}

const styles = StyleSheet.create({
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 52, marginTop: 8 },
  axisLabel: { fontSize: 9, fontVariant: ['tabular-nums'] },
  card: { borderColor: 'rgba(142,142,147,0.3)', borderRadius: 20, borderWidth: 1, padding: 14 },
  date: { fontSize: 9, height: rowHeight, lineHeight: rowHeight },
  dateColumn: { width: 52 },
  pill: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 7 },
  pillDot: { borderRadius: 4, height: 8, width: 8 },
  pills: { flexDirection: 'row', gap: 8 },
  pillText: { fontSize: 11, fontWeight: '700' },
  plot: { flex: 1, position: 'relative' },
  point: { borderColor: '#ffffff', borderRadius: 5, borderWidth: 1, height: 8, marginLeft: -4, position: 'absolute', top: 9, width: 8 },
  row: { height: rowHeight, position: 'relative' },
  sleepBar: { borderRadius: 3, height: 10, opacity: 0.35, position: 'absolute', top: 8 },
  targetRule: { bottom: 0, opacity: 0.7, position: 'absolute', top: 0, width: 1 },
  timeline: { flexDirection: 'row' },
});
