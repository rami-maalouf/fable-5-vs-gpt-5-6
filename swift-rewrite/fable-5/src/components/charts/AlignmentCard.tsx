// ports: Views/SleepDashboardView.swift (HomeSleepAlignmentCard)
// daily bars green 0.68 / orange 0.65 by the 70 target, ema trend line
// (0.8/0.2), dashed green target rule at 70, y axis [0,25,50,70,100],
// daily/trend/main-drag/streak pills, component progress rows
import { Canvas, Circle, DashPathEffect, Line, Path, RoundedRect, vec } from '@shopify/react-native-skia';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Card } from '@/components/common/Card';
import { InsightPills, type InsightItem } from '@/components/dashboard/InsightPills';
import type { AlignmentScorePoint } from '@/domain/metrics/analyzer';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';
import { catmullRomPath } from './path-utils';
import { dayIndexes, formatAbbrevDate, formatMonthDay, xTickIndexes } from './date-scale';

const GREEN = '#34c759';
const RED = '#ff3b30';
const ORANGE = '#ff9500';
const INDIGO = '#5856d6';
const TARGET_SCORE = 70;
const IGNORED_THRESHOLD = 0.03;
const CHART_HEIGHT = 220;
const MARGIN = { top: 8, bottom: 24, left: 34, right: 8 };

interface DisplayPoint {
  source: AlignmentScorePoint;
  dailyScore: number;
  trendScore: number;
}

// ports compositeScore + the core-mode reweighting (duration .35 + consistency .15)
export function buildDisplaySeries(
  series: readonly AlignmentScorePoint[],
  includesTimingAndPhase: boolean
): DisplayPoint[] {
  let previousTrend: number | null = null;
  return series.map((point) => {
    const components = includesTimingAndPhase
      ? [
          { score: point.durationScore, weight: 0.35 },
          { score: point.timingScore, weight: 0.3 },
          { score: point.phaseScore, weight: 0.2 },
          { score: point.consistencyScore, weight: 0.15 },
        ]
      : [
          { score: point.durationScore, weight: 0.35 },
          { score: point.consistencyScore, weight: 0.15 },
        ];
    const active = components.filter(
      (c) => Math.min(Math.max(c.score, 0), 1) > IGNORED_THRESHOLD && c.weight > 0
    );
    const activeWeight = active.reduce((s, c) => s + c.weight, 0);
    const weighted =
      activeWeight > 0
        ? active.reduce(
            (product, c) => product * Math.min(Math.max(c.score, 0), 1) ** (c.weight / activeWeight),
            1
          )
        : 0;
    const dailyScore = Math.min(Math.max(weighted * 100, 0), 100);
    const trendScore = previousTrend != null ? 0.8 * previousTrend + 0.2 * dailyScore : dailyScore;
    previousTrend = trendScore;
    return { source: point, dailyScore, trendScore };
  });
}

function fmtScore(value: number | null): string {
  return value == null ? '-' : String(Math.round(value));
}

function fmtSignedScore(value: number | null): string {
  if (value == null) return '-';
  const rounded = Math.round(value);
  return rounded >= 0 ? `+${rounded}` : String(rounded);
}

export function AlignmentCard({
  series,
  title,
  includesTimingAndPhase,
  width,
}: {
  series: AlignmentScorePoint[];
  title: string;
  includesTimingAndPhase: boolean;
  width: number;
}) {
  const theme = useTheme();
  const fixed = useFixedColor();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const plotted = buildDisplaySeries(series, includesTimingAndPhase);
  const xs = dayIndexes(plotted.map((p) => p.source.date));
  const maxX = xs.length > 0 ? Math.max(xs[xs.length - 1], 1) : 1;

  const latest = plotted.length > 0 ? plotted[plotted.length - 1] : null;
  const weekAgo = plotted.length > 7 ? plotted[plotted.length - 8] : null;
  const selected = selectedIndex != null ? plotted[selectedIndex] : latest;
  const selectedIdx = selectedIndex ?? plotted.length - 1;

  const weekDelta = latest && weekAgo ? latest.trendScore - weekAgo.trendScore : null;
  const dailyDelta =
    selected && selectedIdx > 0 ? selected.dailyScore - plotted[selectedIdx - 1].dailyScore : null;

  const componentDefs = (point: AlignmentScorePoint) => {
    const all = [
      { id: 'duration', title: 'Duration', score: point.durationScore, tint: theme.actionPrimary },
      { id: 'timing', title: 'Timing', score: point.timingScore, tint: fixed(GREEN) },
      { id: 'phase', title: 'Phase', score: point.phaseScore, tint: fixed(INDIGO) },
      { id: 'consistency', title: 'Consistency', score: point.consistencyScore, tint: fixed(ORANGE) },
    ].map((c) => ({ ...c, isIgnored: c.score >= 0 && c.score <= IGNORED_THRESHOLD }));
    return includesTimingAndPhase
      ? all
      : all.filter((c) => c.id === 'duration' || c.id === 'consistency');
  };

  const weakest = selected
    ? componentDefs(selected.source)
        .filter((c) => !c.isIgnored)
        .reduce<ReturnType<typeof componentDefs>[number] | null>(
          (min, c) => (min == null || c.score < min.score ? c : min),
          null
        )
    : null;

  const currentStreak = (() => {
    let count = 0;
    for (let i = plotted.length - 1; i >= 0; i--) {
      if (plotted[i].dailyScore >= TARGET_SCORE) count++;
      else break;
    }
    return count;
  })();
  const bestStreak = (() => {
    let best = 0;
    let current = 0;
    for (const p of plotted) {
      if (p.dailyScore >= TARGET_SCORE) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return best;
  })();

  const trendDirection =
    weekDelta == null
      ? 'Need >7 nights'
      : weekDelta > 1
        ? 'Improving'
        : weekDelta < -1
          ? 'Declining'
          : 'Stable';
  const trendColor =
    weekDelta == null
      ? theme.textSecondary
      : weekDelta > 1
        ? fixed(GREEN)
        : weekDelta < -1
          ? fixed(RED)
          : fixed(ORANGE);

  const pills: InsightItem[] = [
    {
      title: 'daily',
      value: fmtScore(selected?.dailyScore ?? null),
      subtitle: fmtSignedScore(dailyDelta),
      tint: theme.actionPrimary,
    },
    {
      title: 'trend',
      value: fmtScore(selected?.trendScore ?? null),
      subtitle: trendDirection,
      tint: trendColor,
    },
    {
      title: 'main drag',
      value: weakest?.title ?? '-',
      subtitle: weakest ? fmtScore(weakest.score * 100) : '-',
      tint: weakest?.tint ?? theme.textSecondary,
    },
  ];

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  const xPos = (x: number) => MARGIN.left + (x / maxX) * plotW;
  const yPos = (score: number) => MARGIN.top + ((100 - score) / 100) * plotH;
  const barW = Math.min(14, Math.max(3, (plotW / Math.max(plotted.length, 1)) * 0.6));

  const linePoints = plotted.map((p, i) => ({ x: xPos(xs[i]), y: yPos(p.trendScore) }));
  const ticks = xTickIndexes(plotted.length);

  const nearestIndex = (px: number) => {
    if (plotted.length === 0) return null;
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

  const scrub = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => setSelectedIndex(nearestIndex(e.x)))
    .onUpdate((e) => setSelectedIndex(nearestIndex(e.x)))
    .onFinalize(() => setSelectedIndex(null));

  if (plotted.length === 0) {
    return (
      <Card>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        </View>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Track a completed night with an ideal sleep and wake time to unlock your alignment trend.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.stack}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.headline, { color: theme.actionPrimary }]}>
            {fmtScore(latest?.trendScore ?? null)}
          </Text>
        </View>

        <View style={styles.pillsRow}>
          <View style={styles.pillsFlex}>
            <InsightPills items={pills} />
          </View>
          <View style={styles.streakPill}>
            <View style={styles.streakRow}>
              <SymbolView name="flame.fill" size={16} weight="semibold" tintColor={fixed(ORANGE)} />
              <Text style={[styles.streakValue, { color: fixed(ORANGE) }]}>{currentStreak}</Text>
            </View>
            <Text style={styles.streakSubtitle}>
              {bestStreak > 0 ? `best ${bestStreak}d` : 'hit 70+'}
            </Text>
          </View>
        </View>

        <View style={{ width, height: CHART_HEIGHT }}>
          <Canvas style={StyleSheet.absoluteFill}>
            {plotted.map((p, i) => {
              const y = yPos(p.dailyScore);
              return (
                <RoundedRect
                  key={`bar-${i}`}
                  x={xPos(xs[i]) - barW / 2}
                  y={y}
                  width={barW}
                  height={MARGIN.top + plotH - y}
                  r={2}
                  color={
                    p.dailyScore >= TARGET_SCORE
                      ? fixed('rgba(52, 199, 89, 0.68)')
                      : fixed('rgba(255, 149, 0, 0.65)')
                  }
                />
              );
            })}
            <Path
              path={catmullRomPath(linePoints)}
              style="stroke"
              strokeWidth={3}
              color={theme.actionPrimary}
            />
            <Line
              p1={vec(MARGIN.left, yPos(TARGET_SCORE))}
              p2={vec(MARGIN.left + plotW, yPos(TARGET_SCORE))}
              color={fixed('rgba(52, 199, 89, 0.65)')}
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
            {selected && (
              <Circle
                cx={linePoints[selectedIdx].x}
                cy={yPos(selected.trendScore)}
                r={4.2}
                color="#ffffff"
              />
            )}
          </Canvas>
          {[0, 25, 50, 70, 100].map((t) => (
            <Text key={`y-${t}`} style={[styles.yLabel, { top: yPos(t) - 7 }]}>
              {t}
            </Text>
          ))}
          {ticks.map((i) => (
            <Text key={`x-${i}`} style={[styles.xLabel, { left: xPos(xs[i]) - 30 }]}>
              {formatMonthDay(plotted[i].source.date)}
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

        {selected && (
          <>
            <View style={styles.footerRow}>
              <Text style={[styles.caption, { color: theme.textSecondary }]}>
                {formatAbbrevDate(selected.source.date)}
              </Text>
              <View style={styles.footerRight}>
                <Text style={[styles.captionStrong, { color: theme.textPrimary }]}>
                  Score {fmtScore(selected.dailyScore)}
                </Text>
                <Text style={[styles.caption, { color: theme.textSecondary }]}>•</Text>
                <Text
                  style={[
                    styles.captionStrong,
                    {
                      color:
                        selected.dailyScore - TARGET_SCORE >= 0 ? fixed(GREEN) : fixed(ORANGE),
                    },
                  ]}>
                  {fmtSignedScore(selected.dailyScore - TARGET_SCORE)} vs target
                </Text>
              </View>
            </View>
            <View style={styles.components}>
              {componentDefs(selected.source).map((component) => (
                <View key={component.id} style={styles.componentRow}>
                  <Text style={[styles.componentTitle, { color: theme.textSecondary }]}>
                    {component.title}
                  </Text>
                  <View style={[styles.progressTrack, component.isIgnored && styles.ignored]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: component.tint,
                          width: `${Math.min(Math.max(component.score, 0), 1) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.componentScore,
                      { color: component.isIgnored ? theme.textSecondary : theme.textPrimary },
                    ]}>
                    {component.isIgnored ? 'Ignored' : Math.round(component.score * 100)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
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
  pillsRow: { flexDirection: 'row', gap: 8 },
  pillsFlex: { flex: 3 },
  streakPill: {
    flex: 1,
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 28, 30, 0.55)',
    justifyContent: 'center',
  },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakValue: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  streakSubtitle: { fontSize: 11, color: '#98989f' },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: 30,
    textAlign: 'right',
    fontSize: 11,
    color: '#8e8e93',
  },
  xLabel: { position: 'absolute', bottom: 0, width: 60, textAlign: 'center', fontSize: 11, color: '#8e8e93' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  caption: { fontSize: 12 },
  captionStrong: { fontSize: 12, fontWeight: '600' },
  components: { gap: 8, paddingTop: 2 },
  componentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  componentTitle: { fontSize: 12, fontWeight: '600', width: 82 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120, 120, 128, 0.32)',
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },
  ignored: { opacity: 0.45 },
  componentScore: {
    fontSize: 12,
    fontWeight: '600',
    width: 48,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
