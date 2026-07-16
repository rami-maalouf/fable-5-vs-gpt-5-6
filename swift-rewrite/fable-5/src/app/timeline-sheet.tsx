// ports: Views/SleepMetricsView.swift (SleepTimingTimelineSheet)
// horizontal bars bed -> wake per night, indigo/orange endpoints, dashed
// target rules, hour x-axis on the 18:00 offset scale
import { Canvas, Circle, DashPathEffect, Line, RoundedRect, vec } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { SegmentedPicker } from '@/components/dashboard/SegmentedPicker';
import { MetricsEmptyState } from '@/components/metrics/primitives';
import { formatMonthDay } from '@/components/charts/date-scale';
import { BASE_HOUR } from '@/domain/metrics/chart-data';
import { SleepMetricsAnalyzer, type MetricsRange } from '@/domain/metrics/analyzer';
import type { CalendarDay } from '@/domain/models';
import { zonedParts } from '@/domain/session-rules';
import { useSleepStore } from '@/state/app-sleep-store';
import { useSettings } from '@/state/settings-state';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';

const RANGES: MetricsRange[] = ['30D', '90D', '1Y', 'All'];
const INDIGO = '#5856d6';
const ORANGE = '#ff9500';

function todayDay(): CalendarDay {
  const p = zonedParts(Date.now(), Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC');
  return { year: p.year, month: p.month, day: p.day };
}

function hourLabel(offset: number): string {
  const rounded = Math.round(BASE_HOUR + offset);
  return String(((rounded % 24) + 24) % 24);
}

function clockLabel(offset: number): string {
  const absoluteMinutes = Math.round((BASE_HOUR + offset) * 60);
  const wrapped = ((absoluteMinutes % 1440) + 1440) % 1440;
  return `${String(Math.trunc(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

export default function TimelineSheetScreen() {
  const theme = useTheme();
  const fixed = useFixedColor();
  const { width } = useWindowDimensions();
  const sessions = useSleepStore((s) => s.sessions);
  const optimalSleepMinutes = useSettings((s) => s.optimalSleepMinutes);
  const optimalWakeMinutes = useSettings((s) => s.optimalWakeMinutes);
  const [range, setRange] = useState<MetricsRange>('90D');

  const { records, targetSleep, targetWake } = useMemo(() => {
    const analyzer = new SleepMetricsAnalyzer(sessions, {
      optimalSleepMinutes,
      optimalWakeMinutes,
      today: todayDay(),
    });
    return {
      records: analyzer.recordsIn(range),
      targetSleep: analyzer.targetSleepOffset,
      targetWake: analyzer.targetWakeOffset,
    };
  }, [sessions, optimalSleepMinutes, optimalWakeMinutes, range]);

  const values = records.flatMap((r) => [r.bedtimeOffset, r.wakeOffset]);
  if (targetSleep != null) values.push(targetSleep);
  if (targetWake != null) values.push(targetWake);
  const minValue = values.length > 0 ? Math.min(...values) : 3;
  const maxValue = values.length > 0 ? Math.max(...values) : 16;
  const pad = Math.max(0.4, (maxValue - minValue) * 0.12);
  const lower = minValue - pad;
  const upper = maxValue + pad;

  const chartW = width - 20 * 2;
  const leftMargin = 44;
  const plotW = chartW - leftMargin - 10;
  const rowH = 24;
  const chartH = Math.max(360, records.length * rowH);
  const xPos = (offset: number) => leftMargin + ((offset - lower) / (upper - lower || 1)) * plotW;
  const yPos = (i: number) => 10 + i * ((chartH - 30) / Math.max(records.length, 1));

  const hourTicks: number[] = [];
  for (let h = Math.ceil(lower); h <= Math.floor(upper); h++) hourTicks.push(h);
  const labelEvery = Math.max(1, Math.ceil(hourTicks.length / 12));
  const dateTickCount = Math.min(10, Math.max(4, Math.trunc(records.length / 9)));
  const dateStep = Math.max(1, Math.floor(records.length / dateTickCount));

  return (
    <Screen starCount={20}>
      <View style={styles.navOverlay} pointerEvents="box-none">
        <Text style={[styles.navTitle, { color: theme.textPrimary }]}>Sleep/Wake Trend</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.doneButton}>
          <Text style={[styles.done, { color: theme.actionPrimary }]}>Done</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={[styles.heading, { color: theme.textPrimary }]}>
          Long-range Sleep/Wake Trend
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Horizontal bars show each night from bedtime to wake-up. Use 30D, 90D, 1Y, or All to
          inspect drift over time.
        </Text>
        <View style={styles.pickerRow}>
          <SegmentedPicker options={RANGES} value={range} onChange={setRange} />
        </View>

        {records.length === 0 ? (
          <MetricsEmptyState />
        ) : (
          <>
            <View style={styles.pillRow}>
              {targetSleep != null && (
                <View style={styles.targetPill}>
                  <View style={[styles.pillDot, { backgroundColor: fixed(INDIGO) }]} />
                  <Text style={[styles.pillText, { color: theme.textPrimary }]}>
                    Target Bed: {clockLabel(targetSleep)}
                  </Text>
                </View>
              )}
              {targetWake != null && (
                <View style={styles.targetPill}>
                  <View style={[styles.pillDot, { backgroundColor: fixed(ORANGE) }]} />
                  <Text style={[styles.pillText, { color: theme.textPrimary }]}>
                    Target Wake: {clockLabel(targetWake)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.chartCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ width: chartW, height: chartH + 24 }}>
                  <Canvas style={StyleSheet.absoluteFill}>
                    {hourTicks.map((h) => (
                      <Line
                        key={`grid-${h}`}
                        p1={vec(xPos(h), 6)}
                        p2={vec(xPos(h), chartH)}
                        color="rgba(142, 142, 147, 0.15)"
                        strokeWidth={0.5}
                      />
                    ))}
                    {targetSleep != null && (
                      <Line p1={vec(xPos(targetSleep), 6)} p2={vec(xPos(targetSleep), chartH)} color={fixed('rgba(88, 86, 214, 0.7)')} strokeWidth={1.4}>
                        <DashPathEffect intervals={[4, 4]} />
                      </Line>
                    )}
                    {targetWake != null && (
                      <Line p1={vec(xPos(targetWake), 6)} p2={vec(xPos(targetWake), chartH)} color={fixed('rgba(255, 149, 0, 0.7)')} strokeWidth={1.4}>
                        <DashPathEffect intervals={[4, 4]} />
                      </Line>
                    )}
                    {records.map((r, i) => (
                      <RoundedRect
                        key={`bar-${i}`}
                        x={xPos(r.bedtimeOffset)}
                        y={yPos(i) - 5}
                        width={Math.max(2, xPos(r.wakeOffset) - xPos(r.bedtimeOffset))}
                        height={10}
                        r={3}
                        color={`${theme.actionPrimary}59`}
                      />
                    ))}
                    {records.map((r, i) => (
                      <Circle key={`bed-${i}`} cx={xPos(r.bedtimeOffset)} cy={yPos(i)} r={2.8} color={fixed(INDIGO)} />
                    ))}
                    {records.map((r, i) => (
                      <Circle key={`wake-${i}`} cx={xPos(r.wakeOffset)} cy={yPos(i)} r={2.8} color={fixed(ORANGE)} />
                    ))}
                  </Canvas>
                  {records.map((r, i) =>
                    i % dateStep === 0 ? (
                      <Text key={`date-${i}`} style={[styles.dateLabel, { top: yPos(i) - 7 }]}>
                        {formatMonthDay(r.date)}
                      </Text>
                    ) : null
                  )}
                  {hourTicks.map((h, i) =>
                    i % labelEvery === 0 ? (
                      <Text key={`hour-${h}`} style={[styles.hourLabel, { left: xPos(h) - 12, top: chartH + 4 }]}>
                        {hourLabel(h)}
                      </Text>
                    ) : null
                  )}
                </View>
              </ScrollView>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { fontSize: 17, fontWeight: '600' },
  doneButton: { position: 'absolute', right: 16, top: 14 },
  done: { fontSize: 17, fontWeight: '600' },
  body: { flex: 1, paddingTop: 56, paddingHorizontal: 20, gap: 14 },
  heading: { fontSize: 17, fontWeight: '600' },
  subtitle: { fontSize: 15 },
  pickerRow: { flexDirection: 'row' },
  pillRow: { flexDirection: 'row', gap: 8 },
  targetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 28, 30, 0.6)',
  },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontSize: 12, fontWeight: '600' },
  chartCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 28, 30, 0.55)',
    marginBottom: 16,
  },
  dateLabel: { position: 'absolute', left: 0, width: 40, fontSize: 9, color: '#8e8e93' },
  hourLabel: { position: 'absolute', width: 24, textAlign: 'center', fontSize: 10, color: '#8e8e93' },
});
