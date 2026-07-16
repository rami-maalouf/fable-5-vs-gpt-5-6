// ports: twilight/views/sleepmetricsview.swift

import { Circle, DashPathEffect, Line, Path, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CartesianChart, useChartPressState, type PointsArray } from 'victory-native';

import {
  ChartSelectionBubble,
  METRICS_CHART_HEIGHT,
  METRICS_CHART_PADDING,
  MetricsChartAxes,
  MetricsChartCard,
} from '@/components/charts/MetricsChartCard';
import {
  createRegularityChartModel,
  type RegularityChartPoint,
} from '@/components/charts/metrics-chart-models';
import { createLinearPath } from '@/components/charts/skia-chart-paths';
import { usePersistentChartSelection } from '@/components/charts/use-persistent-chart-selection';
import type { SleepNightRecord } from '@/domain/metrics/core';
import { useTheme } from '@/theme/ThemeProvider';

const bedtimeColor = '#7b68ee';
const wakeColor = '#ff9f0a';
const accuracyColor = '#30d158';

export function RegularityComponentsChart({
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
    () => createRegularityChartModel(records, targetSleepOffset, targetWakeOffset),
    [records, targetSleepOffset, targetWakeOffset],
  );
  const { state } = useChartPressState({
    x: model.data.at(-1)?.date ?? 0,
    y: { accuracy: 0, bedtime: 0, wake: 0 },
  });
  const { hasSelection, selectedIndex } = usePersistentChartSelection(state, model.data.length);
  const selected = model.data[selectedIndex];

  return (
    <MetricsChartCard
      subtitle="Bedtime, wake, and target accuracy across a rolling 14-night window."
      title="Rolling 14-Night Components"
    >
      <View style={styles.legend}>
        <Legend color={bedtimeColor} label="Bedtime" />
        <Legend color={wakeColor} label="Wake" />
        <Legend color={accuracyColor} label="Accuracy" />
      </View>
      {model.data.length === 0 ? (
        <ChartUnavailable nightsNeeded={Math.max(0, 14 - records.length)} />
      ) : (
        <View accessibilityLabel="Rolling regularity components chart. Drag horizontally to inspect a night." style={styles.frame}>
          <CartesianChart<RegularityChartPoint, 'date', 'bedtime' | 'wake' | 'accuracy'>
            chartPressConfig={{ pan: { activateAfterLongPress: 0 } }}
            chartPressState={state}
            data={model.data}
            domain={{ y: model.domain }}
            domainPadding={{ left: 10, right: 10 }}
            frame={{ lineColor: 'transparent', lineWidth: { bottom: 0, left: 0, right: 0, top: 0 } }}
            padding={METRICS_CHART_PADDING}
            xKey="date"
            yKeys={['bedtime', 'wake', 'accuracy']}
          >
            {({ chartBounds, points, xScale }) => (
              <>
                <ComponentLine color={bedtimeColor} points={points.bedtime} />
                <ComponentLine color={wakeColor} points={points.wake} />
                <ComponentLine color={accuracyColor} dashed points={points.accuracy} />
                <PointSeries chartBottom={chartBounds.bottom} color={bedtimeColor} points={points.bedtime} />
                <PointSeries chartBottom={chartBounds.bottom} color={wakeColor} points={points.wake} />
                <PointSeries chartBottom={chartBounds.bottom} color={accuracyColor} points={points.accuracy} />
                {hasSelection && selected ? (
                  <Line
                    color="rgba(255,255,255,0.45)"
                    p1={vec(xScale(selected.date), chartBounds.top)}
                    p2={vec(xScale(selected.date), chartBounds.bottom)}
                    strokeWidth={1}
                  >
                    <DashPathEffect intervals={[2, 3]} />
                  </Line>
                ) : null}
              </>
            )}
          </CartesianChart>
          <MetricsChartAxes
            data={model.data}
            domain={model.domain}
            formatY={(value) => `${Math.round(value)}%`}
            ticks={[model.domain[1], Math.round((model.domain[0] + model.domain[1]) / 2), model.domain[0]]}
          />
          {hasSelection && selected ? (
            <ChartSelectionBubble
              accent={bedtimeColor}
              date={selected.date}
              lines={(
                <Text numberOfLines={1} style={[styles.selectionText, { color: theme.textPrimary }]}>
                  B {selected.bedtime}%  W {selected.wake}%  A {selected.accuracy}%
                </Text>
              )}
            />
          ) : null}
        </View>
      )}
    </MetricsChartCard>
  );
}

function ComponentLine({ color, dashed = false, points }: { color: string; dashed?: boolean; points: PointsArray }) {
  const clean = useMemo(
    () => points.flatMap((point) => typeof point.y === 'number' ? [{ x: point.x, y: point.y }] : []),
    [points],
  );
  const path = useMemo(() => createLinearPath(clean), [clean]);
  return (
    <Path color={color} path={path} strokeWidth={2.8} style="stroke">
      {dashed ? <DashPathEffect intervals={[4, 3]} /> : null}
    </Path>
  );
}

function PointSeries({ chartBottom, color, points }: { chartBottom: number; color: string; points: PointsArray }) {
  return points.map((point) => (
    <Circle color={color} cx={point.x} cy={point.y ?? chartBottom} key={String(point.xValue)} r={3} />
  ));
}

function Legend({ color, label }: { color: string; label: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function ChartUnavailable({ nightsNeeded }: { nightsNeeded: number }) {
  const { theme } = useTheme();
  return (
    <View accessibilityRole="summary" style={styles.unavailable}>
      <Text style={[styles.unavailableValue, { color: theme.textPrimary }]}>{nightsNeeded}</Text>
      <Text style={[styles.unavailableCopy, { color: theme.textSecondary }]}>more {nightsNeeded === 1 ? 'night' : 'nights'} to compare regularity components</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: METRICS_CHART_HEIGHT, overflow: 'hidden' },
  legend: { flexDirection: 'row', gap: 14, marginTop: 12 },
  legendDot: { borderRadius: 4, height: 8, width: 8 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  legendLabel: { fontSize: 11, fontWeight: '700' },
  selectionText: { fontSize: 11, fontWeight: '800' },
  unavailable: { alignItems: 'center', height: 180, justifyContent: 'center', paddingHorizontal: 24 },
  unavailableCopy: { fontSize: 13, lineHeight: 18, marginTop: 4, textAlign: 'center' },
  unavailableValue: { fontSize: 32, fontWeight: '800' },
});
