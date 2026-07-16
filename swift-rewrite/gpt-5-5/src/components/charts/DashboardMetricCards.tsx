import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line as SkiaLine,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { Area, CartesianChart, Line, type ChartBounds, useChartPressState } from 'victory-native';

import { CardBackground } from '@/components/common';
import { rgba } from '@/components/common/color';
import { Spacing } from '@/constants/theme';
import type { SleepSettings } from '@/domain/models';
import type { SleepNightRecord } from '@/domain/metrics/core';
import type { AppTheme } from '@/theme';

import {
  buildAlignmentCardModel,
  buildMovingAverageCardModel,
  formatSignedHours,
  type AlignmentChartPoint,
  type MovingAverageChartPoint,
} from './dashboard-card-models';

type DashboardMetricCardProps = {
  records: readonly SleepNightRecord[];
  settings: SleepSettings;
  theme: AppTheme;
};

const chartHeight = 220;

function selectionX(bounds: ChartBounds | null, index: number, pointCount: number) {
  if (!bounds) {
    return 0;
  }

  const width = bounds.right - bounds.left;
  return bounds.left + (width / Math.max(1, pointCount - 1)) * index;
}

function EmptyCard({ body, theme, title }: { body: string; theme: AppTheme; title: string }) {
  return (
    <CardBackground theme={theme} style={styles.card}>
      <View style={styles.emptyCard}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{body}</Text>
      </View>
    </CardBackground>
  );
}

export function MovingAverageCard({ records, settings, theme }: DashboardMetricCardProps) {
  const model = useMemo(() => buildMovingAverageCardModel(records, settings), [records, settings]);
  const [bounds, setBounds] = useState<ChartBounds | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, model.points.length - 1));
  const { state } = useChartPressState({
    x: 0,
    y: {
      movingAverageHours: 0,
    },
  });

  useAnimatedReaction(
    () => state.matchedIndex.value,
    (nextIndex) => {
      runOnJS(setSelectedIndex)(Math.max(0, Math.min(model.points.length - 1, nextIndex)));
    },
    [model.points.length],
  );

  if (model.points.length === 0) {
    return (
      <EmptyCard
        body="Track at least seven nights to unlock the rolling average."
        theme={theme}
        title="seven-night average"
      />
    );
  }

  const selected = model.points[selectedIndex] ?? model.latest;
  const areaColor = (model.latest?.vsTargetHours ?? 0) >= 0 ? rgba(theme.success, 0.22) : 'rgba(255, 80, 80, 0.22)';
  const selectedLeft = selectionX(bounds, selected?.index ?? 0, Math.max(1, model.points.length));

  return (
    <CardBackground theme={theme} style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.cardEyebrow, { color: theme.textSecondary }]}>7-night avg</Text>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {model.latest ? `${model.latest.movingAverageHours.toFixed(1)}h` : '--'}
          </Text>
        </View>
        <View style={styles.pillRow}>
          <InfoPill label="vs target" theme={theme} value={formatSignedHours(model.latest?.vsTargetHours ?? null)} />
          <InfoPill label="vs 7d" theme={theme} value={formatSignedHours(model.latest?.vsPriorHours ?? null)} />
        </View>
      </View>
      <View style={styles.chartFrame}>
        <CartesianChart<MovingAverageChartPoint, 'index', 'movingAverageHours'>
          chartPressState={state}
          data={model.points}
          domain={{ x: [0, Math.max(0, model.points.length - 1)], y: model.domain }}
          frame={{ lineColor: 'rgba(255,255,255,0.10)', lineWidth: 0 }}
          onChartBoundsChange={setBounds}
          padding={{ left: 34, right: 18, top: 16, bottom: 30 }}
          xAxis={{ labelColor: 'transparent', lineWidth: 0 }}
          xKey="index"
          yAxis={[{ labelColor: 'transparent', lineWidth: 0, yKeys: ['movingAverageHours'] }]}
          yKeys={['movingAverageHours']}>
          {({ chartBounds, points, yScale }) => (
            <Group>
              <Area color={areaColor} curveType="catmullRom" points={points.movingAverageHours} y0={yScale(model.targetHours)} />
              <Line color={theme.actionPrimary} curveType="catmullRom" points={points.movingAverageHours} strokeWidth={3} />
              <SkiaLine
                color="rgba(255,255,255,0.72)"
                p1={vec(chartBounds.left, yScale(model.targetHours))}
                p2={vec(chartBounds.right, yScale(model.targetHours))}
                strokeWidth={1.2}>
                <DashPathEffect intervals={[4, 4]} />
              </SkiaLine>
              {selected ? <Circle color="#ffffff" cx={selectionX(chartBounds, selected.index, model.points.length)} cy={yScale(selected.movingAverageHours)} r={7} /> : null}
            </Group>
          )}
        </CartesianChart>
        <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
          {bounds ? (
            <SkiaLine color="rgba(255,255,255,0.4)" p1={vec(selectedLeft, bounds.top)} p2={vec(selectedLeft, bounds.bottom)} strokeWidth={1}>
              <DashPathEffect intervals={[2, 3]} />
            </SkiaLine>
          ) : null}
        </Canvas>
      </View>
      {selected ? (
        <SelectionFooter
          theme={theme}
          title={selected.dateKey}
          values={[
            `${selected.movingAverageHours.toFixed(1)}h avg`,
            `${formatSignedHours(selected.vsTargetHours)} target`,
            `${formatSignedHours(selected.vsPriorHours)} vs 7d`,
          ]}
        />
      ) : null}
    </CardBackground>
  );
}

export function AlignmentScoreCard({ records, settings, theme }: DashboardMetricCardProps) {
  const model = useMemo(() => buildAlignmentCardModel(records, settings), [records, settings]);
  const [bounds, setBounds] = useState<ChartBounds | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, model.points.length - 1));
  const { state } = useChartPressState({
    x: 0,
    y: {
      dailyScore: 0,
      trendScore: 0,
    },
  });

  useAnimatedReaction(
    () => state.matchedIndex.value,
    (nextIndex) => {
      runOnJS(setSelectedIndex)(Math.max(0, Math.min(model.points.length - 1, nextIndex)));
    },
    [model.points.length],
  );

  if (model.points.length === 0) {
    return (
      <EmptyCard
        body="Track a valid night to calculate sleep alignment."
        theme={theme}
        title="alignment score"
      />
    );
  }

  const selected = model.points[selectedIndex] ?? model.latest;
  const selectedLeft = selectionX(bounds, selected?.index ?? 0, Math.max(1, model.points.length));

  return (
    <CardBackground theme={theme} style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.cardEyebrow, { color: theme.textSecondary }]}>sleep alignment</Text>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{model.latest?.trendScore ?? '--'}</Text>
        </View>
        <View style={styles.pillRow}>
          <InfoPill label="daily" theme={theme} value={`${model.latest?.dailyScore ?? '--'}`} />
          <InfoPill label="best 7d" theme={theme} value={`${model.bestSevenDayScore ?? '--'}`} />
        </View>
      </View>
      <View style={styles.chartFrame}>
        <CartesianChart<AlignmentChartPoint, 'index', 'dailyScore' | 'trendScore'>
          chartPressState={state}
          data={model.points}
          domain={{ x: [0, Math.max(0, model.points.length - 1)], y: [0, 100] }}
          frame={{ lineColor: 'rgba(255,255,255,0.10)', lineWidth: 0 }}
          onChartBoundsChange={setBounds}
          padding={{ left: 34, right: 18, top: 16, bottom: 30 }}
          xAxis={{ labelColor: 'transparent', lineWidth: 0 }}
          xKey="index"
          yAxis={[{ labelColor: 'transparent', lineWidth: 0, tickValues: [0, 25, 50, 70, 100], yKeys: ['dailyScore'] }]}
          yKeys={['dailyScore', 'trendScore']}>
          {({ chartBounds, points, xScale, yScale }) => (
            <Group>
              {model.points.map((point) => {
                const y = yScale(point.dailyScore);
                return (
                  <RoundedRect
                    color={point.dailyScore >= 70 ? rgba(theme.success, 0.68) : 'rgba(255, 149, 0, 0.65)'}
                    height={yScale(0) - y}
                    key={point.dateKey}
                    r={4}
                    width={10}
                    x={xScale(point.index) - 5}
                    y={y}
                  />
                );
              })}
              <Line color={theme.actionPrimary} curveType="catmullRom" points={points.trendScore} strokeWidth={3} />
              <SkiaLine color={rgba(theme.success, 0.65)} p1={vec(chartBounds.left, yScale(70))} p2={vec(chartBounds.right, yScale(70))} strokeWidth={1.2}>
                <DashPathEffect intervals={[4, 4]} />
              </SkiaLine>
              {selected ? <Circle color="#ffffff" cx={selectionX(chartBounds, selected.index, model.points.length)} cy={yScale(selected.dailyScore)} r={7} /> : null}
            </Group>
          )}
        </CartesianChart>
        <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
          {bounds ? (
            <SkiaLine color="rgba(255,255,255,0.4)" p1={vec(selectedLeft, bounds.top)} p2={vec(selectedLeft, bounds.bottom)} strokeWidth={1}>
              <DashPathEffect intervals={[2, 3]} />
            </SkiaLine>
          ) : null}
        </Canvas>
      </View>
      {selected ? (
        <>
          <SelectionFooter
            theme={theme}
            title={selected.dateKey}
            values={[`daily ${selected.dailyScore}`, `trend ${selected.trendScore}`, selected.dailyScore >= 70 ? 'on track' : 'needs repair']}
          />
          <View style={styles.componentBars}>
            <ComponentBar label="duration" theme={theme} value={selected.durationScore} />
            <ComponentBar label="timing" theme={theme} value={selected.timingScore} />
            <ComponentBar label="phase" theme={theme} value={selected.phaseScore} />
            <ComponentBar label="consistency" theme={theme} value={selected.consistencyScore} />
          </View>
        </>
      ) : null}
    </CardBackground>
  );
}

function InfoPill({ label, theme, value }: { label: string; theme: AppTheme; value: string }) {
  return (
    <View style={[styles.infoPill, { borderColor: rgba(theme.textPrimary, 0.14), backgroundColor: rgba(theme.textPrimary, 0.06) }]}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

function SelectionFooter({ theme, title, values }: { theme: AppTheme; title: string; values: string[] }) {
  return (
    <View style={[styles.selectionFooter, { backgroundColor: rgba(theme.textPrimary, 0.07) }]}>
      <Text style={[styles.selectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      <Text style={[styles.selectionValues, { color: theme.textPrimary }]}>{values.join(' · ')}</Text>
    </View>
  );
}

function ComponentBar({ label, theme, value }: { label: string; theme: AppTheme; value: number }) {
  return (
    <View style={styles.componentBarRow}>
      <Text style={[styles.componentLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.componentTrack, { backgroundColor: rgba(theme.textPrimary, 0.08) }]}>
        <View style={[styles.componentFill, { backgroundColor: value >= 70 ? theme.success : theme.warning, width: `${value}%` }]} />
      </View>
      <Text style={[styles.componentValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 0,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 42,
    marginTop: Spacing.one,
  },
  chartFrame: {
    height: chartHeight,
    marginTop: Spacing.three,
  },
  componentBarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  componentBars: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  componentFill: {
    borderRadius: 999,
    height: 8,
  },
  componentLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
    width: 82,
  },
  componentTrack: {
    borderRadius: 999,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  componentValue: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
    width: 30,
  },
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 220,
    justifyContent: 'center',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  infoPill: {
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 76,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'flex-end',
  },
  selectionFooter: {
    borderRadius: 14,
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
  selectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  selectionValues: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
});
