import { Canvas, Circle, DashPathEffect, Group, Line as SkiaLine, RoundedRect, vec } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { Area, CartesianChart, Line, type ChartBounds, useChartPressState } from 'victory-native';

import { CardBackground } from '@/components/common';
import { rgba } from '@/components/common/color';
import { Spacing } from '@/constants/theme';
import type { SleepSettings } from '@/domain/models';
import type { SleepNightRecord } from '@/domain/metrics/core';
import type { AppTheme } from '@/theme';

import {
  buildDurationMomentumModel,
  buildDurationHistogramModel,
  buildRollingComponentsModel,
  buildRollingConsistencyModel,
  buildSleepDebtModel,
  buildWeekdayAveragesModel,
  type ComponentFilter,
  type ComponentSeriesKey,
  type DurationHistogramChartPoint,
  type DurationMomentumPoint,
  type RollingConsistencyPoint,
  type SleepDebtChartPoint,
  type WeekdayAverageChartPoint,
} from './metrics-chart-models';

const chartHeight = 220;
const componentFilters: { label: string; value: ComponentFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Bedtime', value: 'bedtime' },
  { label: 'Wake', value: 'wake' },
  { label: 'Accuracy', value: 'accuracy' },
];

function selectedIndexFromBounds(bounds: ChartBounds | null, index: number, pointCount: number) {
  if (!bounds) {
    return 0;
  }

  const width = bounds.right - bounds.left;
  return bounds.left + (width / Math.max(1, pointCount - 1)) * index;
}

function EmptyChartCard({ body, theme, title }: { body: string; theme: AppTheme; title: string }) {
  return (
    <CardBackground theme={theme} style={styles.card}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>
    </CardBackground>
  );
}

function ChartFooter({
  items,
  theme,
  title,
}: {
  items: string[];
  theme: AppTheme;
  title: string;
}) {
  return (
    <View style={[styles.footer, { borderColor: rgba(theme.textPrimary, 0.12), backgroundColor: rgba(theme.textPrimary, 0.06) }]}>
      <Text style={[styles.footerTitle, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.footerBody, { color: theme.textSecondary }]}>{items.join(' · ')}</Text>
    </View>
  );
}

export function DurationMomentumCard({
  records,
  settings,
  theme,
}: {
  records: readonly SleepNightRecord[];
  settings: SleepSettings;
  theme: AppTheme;
}) {
  const model = useMemo(() => buildDurationMomentumModel(records, settings), [records, settings]);
  const [bounds, setBounds] = useState<ChartBounds | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, model.points.length - 1));
  const { state } = useChartPressState({
    x: 0,
    y: {
      durationHours: 0,
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
    return <EmptyChartCard body="Track a valid night to unlock duration momentum." theme={theme} title="Duration momentum" />;
  }

  const selected = model.points[selectedIndex] ?? model.latest;
  const selectionLeft = selectedIndexFromBounds(bounds, selected?.index ?? 0, model.points.length);

  return (
    <CardBackground theme={theme} style={styles.card}>
      <ChartHeader
        eyebrow="duration momentum"
        metric={selected ? `${selected.durationHours.toFixed(1)}h` : '--'}
        theme={theme}
        title="Daily sleep versus your goal"
      />
      <View style={styles.chartFrame}>
        <CartesianChart<DurationMomentumPoint, 'index', 'durationHours' | 'movingAverageHours'>
          chartPressState={state}
          data={model.points}
          domain={{ x: [0, Math.max(0, model.points.length - 1)], y: model.domain }}
          frame={{ lineColor: 'rgba(255,255,255,0.10)', lineWidth: 0 }}
          onChartBoundsChange={setBounds}
          padding={{ left: 28, right: 18, top: 16, bottom: 26 }}
          xAxis={{ labelColor: 'transparent', lineWidth: 0 }}
          xKey="index"
          yAxis={[{ labelColor: 'transparent', lineWidth: 0, yKeys: ['durationHours', 'movingAverageHours'] }]}
          yKeys={['durationHours', 'movingAverageHours']}>
          {({ chartBounds, points, xScale, yScale }) => (
            <Group>
              {model.points.map((point) => {
                const barTop = yScale(point.durationHours);
                return (
                  <RoundedRect
                    color={point.targetMet ? rgba(theme.success, 0.76) : rgba(theme.warning, 0.72)}
                    height={Math.max(2, chartBounds.bottom - barTop)}
                    key={point.dateKey}
                    r={4}
                    width={16}
                    x={xScale(point.index) - 8}
                    y={barTop}
                  />
                );
              })}
              <Line color={theme.actionPrimary} connectMissingData curveType="catmullRom" points={points.movingAverageHours} strokeWidth={2.5} />
              <SkiaLine color="rgba(255,255,255,0.60)" p1={vec(chartBounds.left, yScale(model.targetHours))} p2={vec(chartBounds.right, yScale(model.targetHours))} strokeWidth={1.2}>
                <DashPathEffect intervals={[4, 4]} />
              </SkiaLine>
              {selected ? <Circle color="#ffffff" cx={xScale(selected.index)} cy={yScale(selected.durationHours)} r={6} /> : null}
            </Group>
          )}
        </CartesianChart>
        {bounds ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <SkiaOverlay left={selectionLeft} top={bounds.top} bottom={bounds.bottom} />
          </View>
        ) : null}
      </View>
      {selected ? (
        <ChartFooter
          items={[
            `${selected.durationHours.toFixed(1)}h duration`,
            selected.movingAverageHours == null ? '7-night avg pending' : `${selected.movingAverageHours.toFixed(1)}h 7-night avg`,
          ]}
          theme={theme}
          title={selected.dateKey}
        />
      ) : null}
    </CardBackground>
  );
}

function SkiaOverlay({ bottom, left, top }: { bottom: number; left: number; top: number }) {
  return (
    <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Group>
        <SkiaLine color="rgba(255,255,255,0.35)" p1={vec(left, top)} p2={vec(left, bottom)} strokeWidth={1}>
          <DashPathEffect intervals={[2, 3]} />
        </SkiaLine>
      </Group>
    </Canvas>
  );
}

export function RollingConsistencyCard({
  records,
  settings,
  theme,
}: {
  records: readonly SleepNightRecord[];
  settings: SleepSettings;
  theme: AppTheme;
}) {
  const model = useMemo(() => buildRollingConsistencyModel(records, settings), [records, settings]);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, model.points.length - 1));
  const { state } = useChartPressState({ x: 0, y: { score: 0 } });

  useAnimatedReaction(
    () => state.matchedIndex.value,
    (nextIndex) => {
      runOnJS(setSelectedIndex)(Math.max(0, Math.min(model.points.length - 1, nextIndex)));
    },
    [model.points.length],
  );

  if (model.points.length < 14) {
    return <EmptyChartCard body="Track fourteen valid nights to unlock rolling consistency." theme={theme} title="Rolling consistency" />;
  }

  const selected = model.points[selectedIndex] ?? model.latest;

  return (
    <CardBackground theme={theme} style={styles.card}>
      <ChartHeader
        eyebrow="regularity"
        metric={selected?.score == null ? '--' : String(selected.score)}
        theme={theme}
        title="Rolling consistency"
      />
      <View style={styles.chartFrame}>
        <CartesianChart<RollingConsistencyPoint, 'index', 'score'>
          chartPressState={state}
          data={model.points}
          domain={{ x: [0, Math.max(0, model.points.length - 1)], y: [0, 100] }}
          frame={{ lineColor: 'rgba(255,255,255,0.10)', lineWidth: 0 }}
          padding={{ left: 28, right: 18, top: 16, bottom: 26 }}
          xAxis={{ labelColor: 'transparent', lineWidth: 0 }}
          xKey="index"
          yAxis={[{ labelColor: 'transparent', lineWidth: 0, tickValues: [0, 50, 80, 100], yKeys: ['score'] }]}
          yKeys={['score']}>
          {({ chartBounds, points, yScale }) => (
            <Group>
              <Line color={theme.actionPrimary} connectMissingData curveType="catmullRom" points={points.score} strokeWidth={3} />
              <SkiaLine color={rgba(theme.success, 0.68)} p1={vec(chartBounds.left, yScale(80))} p2={vec(chartBounds.right, yScale(80))} strokeWidth={1.2}>
                <DashPathEffect intervals={[4, 4]} />
              </SkiaLine>
            </Group>
          )}
        </CartesianChart>
      </View>
      {selected ? <ChartFooter items={[selected.score == null ? 'score pending' : `${selected.score} score`]} theme={theme} title={selected.dateKey} /> : null}
    </CardBackground>
  );
}

export function RollingComponentsCard({
  records,
  settings,
  theme,
}: {
  records: readonly SleepNightRecord[];
  settings: SleepSettings;
  theme: AppTheme;
}) {
  const [filter, setFilter] = useState<ComponentFilter>('all');
  const model = useMemo(() => buildRollingComponentsModel(records, settings, filter), [filter, records, settings]);

  if (model.points.length < 14) {
    return <EmptyChartCard body="The component chart needs fourteen valid nights." theme={theme} title="14-night components" />;
  }

  return (
    <CardBackground theme={theme} style={styles.card}>
      <ChartHeader eyebrow="components" metric={model.latest?.score == null ? '--' : String(model.latest.score)} theme={theme} title="14-night components" />
      <View style={styles.filterRow}>
        {componentFilters.map((item) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item.value }}
            key={item.value}
            onPress={() => setFilter(item.value)}
            style={({ pressed }) => [
              styles.filterButton,
              { backgroundColor: filter === item.value ? theme.actionPrimary : rgba(theme.textPrimary, 0.07) },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.filterText, { color: filter === item.value ? '#ffffff' : theme.textSecondary }]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.chartFrame}>
        <CartesianChart<RollingConsistencyPoint, 'index', ComponentSeriesKey>
          data={model.points}
          domain={{ x: [0, Math.max(0, model.points.length - 1)], y: [0, 100] }}
          frame={{ lineColor: 'rgba(255,255,255,0.10)', lineWidth: 0 }}
          padding={{ left: 28, right: 18, top: 16, bottom: 26 }}
          xAxis={{ labelColor: 'transparent', lineWidth: 0 }}
          xKey="index"
          yAxis={[{ labelColor: 'transparent', lineWidth: 0, tickValues: [0, 50, 80, 100], yKeys: model.series }]}
          yKeys={model.series}>
          {({ points }) => (
            <Group>
              {model.series.includes('sleepConsistency') ? <Line color="#7B68EE" connectMissingData curveType="catmullRom" points={points.sleepConsistency} strokeWidth={2.8} /> : null}
              {model.series.includes('wakeConsistency') ? <Line color={theme.warning} connectMissingData curveType="catmullRom" points={points.wakeConsistency} strokeWidth={2.8} /> : null}
              {model.series.includes('scheduleAccuracy') ? <Line color={theme.success} connectMissingData curveType="catmullRom" points={points.scheduleAccuracy} strokeWidth={2.8} /> : null}
            </Group>
          )}
        </CartesianChart>
      </View>
      <ChartFooter items={model.series.map(labelForSeries)} theme={theme} title={model.latest?.dateKey ?? 'latest'} />
    </CardBackground>
  );
}

export function SleepDebtCard({
  records,
  settings,
  theme,
}: {
  records: readonly SleepNightRecord[];
  settings: SleepSettings;
  theme: AppTheme;
}) {
  const model = useMemo(() => buildSleepDebtModel(records, settings), [records, settings]);

  if (model.points.length === 0) {
    return <EmptyChartCard body="Track a valid night to compare cumulative sleep debt against your goal." theme={theme} title="Sleep debt" />;
  }

  return (
    <CardBackground theme={theme} style={styles.card}>
      <ChartHeader eyebrow="recovery" metric={`${model.latest?.cumulativeHours ?? 0}h`} theme={theme} title="Sleep debt" />
      <View style={styles.chartFrame}>
        <CartesianChart<SleepDebtChartPoint, 'index', 'cumulativeHours'>
          data={model.points}
          domain={{ x: [0, Math.max(0, model.points.length - 1)], y: model.domain }}
          frame={{ lineColor: 'rgba(255,255,255,0.10)', lineWidth: 0 }}
          padding={{ left: 28, right: 18, top: 16, bottom: 26 }}
          xAxis={{ labelColor: 'transparent', lineWidth: 0 }}
          xKey="index"
          yAxis={[{ labelColor: 'transparent', lineWidth: 0, yKeys: ['cumulativeHours'] }]}
          yKeys={['cumulativeHours']}>
          {({ chartBounds, points, yScale }) => (
            <Group>
              <Area color={rgba(theme.actionPrimary, 0.18)} curveType="catmullRom" points={points.cumulativeHours} y0={yScale(0)} />
              <Line color={theme.actionPrimary} curveType="catmullRom" points={points.cumulativeHours} strokeWidth={3} />
              <SkiaLine color="rgba(255,255,255,0.55)" p1={vec(chartBounds.left, yScale(0))} p2={vec(chartBounds.right, yScale(0))} strokeWidth={1.2}>
                <DashPathEffect intervals={[4, 4]} />
              </SkiaLine>
            </Group>
          )}
        </CartesianChart>
      </View>
      <ChartFooter items={['positive means extra sleep', 'negative means debt']} theme={theme} title={model.latest?.dateKey ?? 'latest'} />
    </CardBackground>
  );
}

export function WeekdayAveragesCard({
  records,
  theme,
}: {
  records: readonly SleepNightRecord[];
  theme: AppTheme;
}) {
  const model = useMemo(() => buildWeekdayAveragesModel(records), [records]);
  const maxHours = Math.max(1, ...model.points.map((point) => point.averageHours));

  if (records.length === 0) {
    return <EmptyChartCard body="Weekday averages unlock after your first valid sleep log." theme={theme} title="Weekday averages" />;
  }

  return (
    <CardBackground theme={theme} style={styles.card}>
      <ChartHeader eyebrow="behavior" metric={`${records.length} nights`} theme={theme} title="Weekday averages" />
      <View style={styles.chartFrame}>
        <CartesianChart<WeekdayAverageChartPoint, 'index', 'averageHours'>
          data={model.points}
          domain={{ x: [0, Math.max(0, model.points.length - 1)], y: [0, maxHours + 1] }}
          frame={{ lineColor: 'rgba(255,255,255,0.10)', lineWidth: 0 }}
          padding={{ left: 28, right: 18, top: 16, bottom: 26 }}
          xAxis={{ labelColor: 'transparent', lineWidth: 0 }}
          xKey="index"
          yAxis={[{ labelColor: 'transparent', lineWidth: 0, yKeys: ['averageHours'] }]}
          yKeys={['averageHours']}>
          {({ chartBounds, xScale, yScale }) => (
            <Group>
              {model.points.map((point) => {
                const barTop = yScale(point.averageHours);
                return (
                  <RoundedRect
                    color={point.isWeekend ? 'rgba(123, 104, 238, 0.78)' : rgba(theme.actionPrimary, 0.72)}
                    height={Math.max(2, chartBounds.bottom - barTop)}
                    key={point.dayName}
                    r={4}
                    width={18}
                    x={xScale(point.index) - 9}
                    y={barTop}
                  />
                );
              })}
            </Group>
          )}
        </CartesianChart>
      </View>
      <ChartFooter items={model.points.map((point) => `${point.dayName} ${point.averageHours.toFixed(1)}h`)} theme={theme} title="daily pattern" />
    </CardBackground>
  );
}

export function DurationHistogramCard({
  records,
  theme,
}: {
  records: readonly SleepNightRecord[];
  theme: AppTheme;
}) {
  const model = useMemo(() => buildDurationHistogramModel(records), [records]);
  const maxCount = Math.max(1, ...model.points.map((point) => point.count));

  if (records.length === 0) {
    return <EmptyChartCard body="The duration histogram fills in when valid nights exist." theme={theme} title="Duration histogram" />;
  }

  return (
    <CardBackground theme={theme} style={styles.card}>
      <ChartHeader eyebrow="distribution" metric={`${records.length} nights`} theme={theme} title="Duration histogram" />
      <View style={styles.chartFrame}>
        <CartesianChart<DurationHistogramChartPoint, 'index', 'count'>
          data={model.points}
          domain={{ x: [0, Math.max(0, model.points.length - 1)], y: [0, maxCount + 1] }}
          frame={{ lineColor: 'rgba(255,255,255,0.10)', lineWidth: 0 }}
          padding={{ left: 28, right: 18, top: 16, bottom: 26 }}
          xAxis={{ labelColor: 'transparent', lineWidth: 0 }}
          xKey="index"
          yAxis={[{ labelColor: 'transparent', lineWidth: 0, yKeys: ['count'] }]}
          yKeys={['count']}>
          {({ chartBounds, xScale, yScale }) => (
            <Group>
              {model.points.map((point) => {
                const barTop = yScale(point.count);
                return (
                  <RoundedRect
                    color={rgba(theme.actionPrimary, 0.72)}
                    height={Math.max(2, chartBounds.bottom - barTop)}
                    key={point.label}
                    r={4}
                    width={16}
                    x={xScale(point.index) - 8}
                    y={barTop}
                  />
                );
              })}
            </Group>
          )}
        </CartesianChart>
      </View>
      <ChartFooter items={model.points.filter((point) => point.count > 0).map((point) => `${point.label} ${Math.round(point.share * 100)}%`)} theme={theme} title="duration spread" />
    </CardBackground>
  );
}

function labelForSeries(series: ComponentSeriesKey) {
  if (series === 'sleepConsistency') {
    return 'bedtime';
  }

  if (series === 'wakeConsistency') {
    return 'wake';
  }

  return 'accuracy';
}

function ChartHeader({
  eyebrow,
  metric,
  theme,
  title,
}: {
  eyebrow: string;
  metric: string;
  theme: AppTheme;
  title: string;
}) {
  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>{eyebrow}</Text>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{title}</Text>
      </View>
      <View style={[styles.metricPill, { backgroundColor: rgba(theme.actionPrimary, 0.18), borderColor: rgba(theme.actionPrimary, 0.34) }]}>
        <Text style={[styles.metricPillText, { color: theme.textPrimary }]}>{metric}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: Spacing.two,
  },
  card: {
    marginHorizontal: Spacing.two,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: Spacing.one,
  },
  chartFrame: {
    height: chartHeight,
    marginTop: Spacing.three,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  filterButton: {
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '900',
  },
  footer: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
  footerBody: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: Spacing.one,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  metricPill: {
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  metricPillText: {
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
