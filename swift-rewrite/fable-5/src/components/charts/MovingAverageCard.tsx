// ports: Views/SleepDashboardView.swift (HomeMovingAverageCard)
// 7-night moving average: green/red 0.22 area segments split at target
// crossings, actionPrimary lw3 catmullRom line, dashed target rule, scrub
// selection with white point, dynamic y domain clamped 0-12 (min span 0.9)
import { Canvas, Circle, DashPathEffect, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Card } from '@/components/common/Card';
import { InsightPills, type InsightItem } from '@/components/dashboard/InsightPills';
import type { MovingAveragePoint } from '@/domain/metrics/analyzer';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';
import { catmullRomPath } from './path-utils';
import { dayIndexes, formatAbbrevDate, formatMonthDay, xTickIndexes } from './date-scale';

const GREEN = '#34c759';
const RED = '#ff3b30';
const ORANGE = '#ff9500';
const CHART_HEIGHT = 220;
const MARGIN = { top: 8, bottom: 24, left: 38, right: 8 };

function fmtHours(value: number | null): string {
  return value == null ? '-' : `${value.toFixed(1)}h`;
}

function fmtSignedHours(value: number | null): string {
  if (value == null) return '-';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}h`;
}

// ports the card's chartDomain computed property exactly
export function movingAverageDomain(
  values: readonly number[],
  target: number
): { lower: number; upper: number } {
  if (values.length === 0) return { lower: 6, upper: 9 };
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const dataRange = Math.max(0.01, dataMax - dataMin);
  const padding = Math.max(0.18, dataRange * 0.12);
  let lower = Math.max(0, dataMin - padding);
  let upper = Math.min(12, dataMax + padding);
  if (target < lower) lower = Math.max(0, target - 0.14);
  else if (target > upper) upper = Math.min(12, target + 0.14);
  if (upper - lower < 0.9) {
    const midpoint = (upper + lower) / 2;
    lower = Math.max(0, midpoint - 0.45);
    upper = Math.min(12, midpoint + 0.45);
  }
  return { lower, upper };
}

// ports areaSegments: split at target crossings with interpolated points
interface AreaSegment {
  above: boolean;
  points: { x: number; hours: number }[];
}

export function buildAreaSegments(
  values: readonly { x: number; hours: number }[],
  target: number
): AreaSegment[] {
  if (values.length === 0) return [];
  const zone = (h: number) => h >= target;
  const segments: AreaSegment[] = [];
  let activeZone = zone(values[0].hours);
  let activePoints = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const previous = values[i - 1];
    const current = values[i];
    if (zone(previous.hours) === zone(current.hours) || Math.abs(current.hours - previous.hours) < 1e-6) {
      activePoints.push(current);
      continue;
    }
    const ratio = Math.min(Math.max((target - previous.hours) / (current.hours - previous.hours), 0), 1);
    const crossingX = previous.x + (current.x - previous.x) * ratio;
    const crossing = { x: crossingX, hours: target };
    activePoints.push(crossing);
    segments.push({ above: activeZone, points: activePoints });
    activeZone = zone(current.hours);
    activePoints = [crossing, current];
  }
  segments.push({ above: activeZone, points: activePoints });
  return segments;
}

export function MovingAverageCard({
  series,
  targetDurationHours,
  width,
}: {
  series: MovingAveragePoint[];
  targetDurationHours: number;
  width: number;
}) {
  const theme = useTheme();
  const fixed = useFixedColor();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const plotted = series.filter((p) => p.movingAverageHours != null);
  const values = plotted.map((p) => p.movingAverageHours!);
  const xs = dayIndexes(plotted.map((p) => p.date));
  const maxX = xs.length > 0 ? Math.max(xs[xs.length - 1], 1) : 1;

  const latest = plotted.length > 0 ? plotted[plotted.length - 1] : null;
  const weekAgo = plotted.length > 7 ? plotted[plotted.length - 8] : null;
  const selected = selectedIndex != null ? plotted[selectedIndex] : latest;

  const weekDelta =
    latest?.movingAverageHours != null && weekAgo?.movingAverageHours != null
      ? latest.movingAverageHours - weekAgo.movingAverageHours
      : null;
  const targetDelta =
    latest?.movingAverageHours != null ? latest.movingAverageHours - targetDurationHours : null;
  const range =
    values.length > 0 ? `${Math.min(...values).toFixed(1)}-${Math.max(...values).toFixed(1)}h` : '-';

  const trendDirection =
    weekDelta == null
      ? 'Need >14 nights'
      : weekDelta > 0.05
        ? 'Improving'
        : weekDelta < -0.05
          ? 'Declining'
          : 'Stable';
  const trendColor =
    weekDelta == null
      ? theme.textSecondary
      : weekDelta > 0.05
        ? fixed(GREEN)
        : weekDelta < -0.05
          ? fixed(RED)
          : fixed(ORANGE);
  const targetColor =
    targetDelta == null ? theme.textSecondary : targetDelta >= 0 ? fixed(GREEN) : fixed(ORANGE);

  const pills: InsightItem[] = [
    { title: 'vs 7d ago', value: fmtSignedHours(weekDelta), subtitle: trendDirection, tint: trendColor },
    { title: 'vs target', value: fmtSignedHours(targetDelta), subtitle: targetDelta == null ? '-' : targetDelta >= 0 ? 'Above target' : 'Below target', tint: targetColor },
    { title: 'range', value: range, subtitle: 'selected span', tint: theme.actionPrimary },
  ];

  const { lower, upper } = movingAverageDomain(values, targetDurationHours);
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  const xPos = (x: number) => MARGIN.left + (x / maxX) * plotW;
  const yPos = (h: number) => MARGIN.top + ((upper - h) / (upper - lower || 1)) * plotH;

  const linePoints = plotted.map((p, i) => ({ x: xPos(xs[i]), y: yPos(p.movingAverageHours!) }));
  const segments = buildAreaSegments(
    plotted.map((p, i) => ({ x: xs[i], hours: p.movingAverageHours! })),
    targetDurationHours
  );

  const areaPath = (segment: AreaSegment) => {
    const builder = Skia.PathBuilder.Make();
    const pts = segment.points;
    builder.moveTo(xPos(pts[0].x), yPos(targetDurationHours));
    for (const p of pts) builder.lineTo(xPos(p.x), yPos(p.hours));
    builder.lineTo(xPos(pts[pts.length - 1].x), yPos(targetDurationHours));
    builder.close();
    return builder.build();
  };

  // 4 evenly spaced y labels inside the domain
  const yTicks = Array.from({ length: 4 }, (_, i) => lower + ((upper - lower) * i) / 3);
  const ticks = xTickIndexes(plotted.length);

  const scrub = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => setSelectedIndex(nearestIndex(e.x)))
    .onUpdate((e) => setSelectedIndex(nearestIndex(e.x)))
    .onFinalize(() => setSelectedIndex(null));

  const nearestIndex = (px: number) => {
    if (plotted.length === 0) return null;
    // the gesture view starts at MARGIN.left, so shift into chart coords
    const target = px + MARGIN.left;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < plotted.length; i++) {
      const d = Math.abs(xPos(xs[i]) - target);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  };

  if (plotted.length === 0) {
    return (
      <Card>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>7-Night Moving Average</Text>
        </View>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Track at least 7 nights to unlock your rolling average trend.
        </Text>
      </Card>
    );
  }

  const selectedHours = selected?.movingAverageHours ?? null;
  const selectedDelta = selectedHours != null ? selectedHours - targetDurationHours : null;

  return (
    <Card>
      <View style={styles.stack}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>7-Night Moving Average</Text>
          <Text style={[styles.headline, { color: theme.actionPrimary }]}>
            {fmtHours(latest?.movingAverageHours ?? null)}
          </Text>
        </View>

        <InsightPills items={pills} />

        <View style={{ width, height: CHART_HEIGHT }}>
          <Canvas style={StyleSheet.absoluteFill}>
            {segments.map((segment, i) => (
              <Path
                key={`seg-${i}`}
                path={areaPath(segment)}
                color={segment.above ? fixed('rgba(52, 199, 89, 0.22)') : fixed('rgba(255, 59, 48, 0.22)')}
              />
            ))}
            <Path
              path={catmullRomPath(linePoints)}
              style="stroke"
              strokeWidth={3}
              color={theme.actionPrimary}
            />
            <Line
              p1={vec(MARGIN.left, yPos(targetDurationHours))}
              p2={vec(MARGIN.left + plotW, yPos(targetDurationHours))}
              color="rgba(142, 142, 147, 0.8)"
              strokeWidth={1.2}>
              <DashPathEffect intervals={[4, 4]} />
            </Line>
            {selected && selectedIndex != null && (
              <Line
                p1={vec(linePoints[selectedIndex].x, MARGIN.top)}
                p2={vec(linePoints[selectedIndex].x, MARGIN.top + plotH)}
                color="rgba(255, 255, 255, 0.4)"
                strokeWidth={1}>
                <DashPathEffect intervals={[2, 3]} />
              </Line>
            )}
            {selected && selectedHours != null && (
              <Circle
                cx={linePoints[selectedIndex ?? linePoints.length - 1].x}
                cy={yPos(selectedHours)}
                r={4.2}
                color="#ffffff"
              />
            )}
          </Canvas>
          {yTicks.map((t) => (
            <Text key={`y-${t}`} style={[styles.yLabel, { top: yPos(t) - 7 }]}>
              {t.toFixed(1)}h
            </Text>
          ))}
          {ticks.map((i) => (
            <Text
              key={`x-${i}`}
              style={[styles.xLabel, { left: xPos(xs[i]) - 30, color: '#8e8e93' }]}>
              {formatMonthDay(plotted[i].date)}
            </Text>
          ))}
          <GestureDetector gesture={scrub}>
            <View
              style={{
                position: 'absolute',
                left: MARGIN.left,
                top: 0,
                width: plotW,
                height: MARGIN.top + plotH,
              }}
            />
          </GestureDetector>
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.caption, { color: theme.textSecondary }]}>
            {selected && selectedIndex != null ? formatAbbrevDate(selected.date) : 'Latest'}
          </Text>
          {selectedHours != null && (
            <View style={styles.footerRight}>
              <Text style={[styles.captionStrong, { color: theme.textPrimary }]}>
                Avg {fmtHours(selectedHours)}
              </Text>
              <Text style={[styles.caption, { color: theme.textSecondary }]}>•</Text>
              <Text
                style={[
                  styles.captionStrong,
                  { color: (selectedDelta ?? 0) >= 0 ? fixed(GREEN) : fixed(ORANGE) },
                ]}>
                {fmtSignedHours(selectedDelta)} vs target
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.caption, { color: theme.textSecondary }]}>
          {weekDelta != null ? `${fmtSignedHours(weekDelta)} vs 7d ago` : '-'}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '600' },
  headline: { fontSize: 17, fontWeight: '600' },
  emptyText: { fontSize: 15, paddingVertical: 24 },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: 34,
    textAlign: 'right',
    fontSize: 11,
    color: '#8e8e93',
  },
  xLabel: { position: 'absolute', bottom: 0, width: 60, textAlign: 'center', fontSize: 11 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  caption: { fontSize: 12 },
  captionStrong: { fontSize: 12, fontWeight: '600' },
});
