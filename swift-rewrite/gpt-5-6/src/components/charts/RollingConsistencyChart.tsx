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
import { createCatmullRomPath, createLinearAreaPath } from '@/components/charts/skia-chart-paths';
import { usePersistentChartSelection } from '@/components/charts/use-persistent-chart-selection';
import type { SleepNightRecord } from '@/domain/metrics/core';
import { useTheme } from '@/theme/ThemeProvider';

const teal = '#30d5c8';

export function RollingConsistencyChart({
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
  const { state } = useChartPressState({ x: model.data.at(-1)?.date ?? 0, y: { composite: 0 } });
  const { hasSelection, selectedIndex } = usePersistentChartSelection(state, model.data.length);
  const selected = model.data[selectedIndex];

  return (
    <MetricsChartCard
      subtitle="Average of bedtime consistency, wake consistency, and schedule accuracy."
      title="Rolling Consistency Score"
    >
      {model.data.length === 0 ? (
        <ChartUnavailable nightsNeeded={Math.max(0, 14 - records.length)} />
      ) : (
        <View accessibilityLabel="Rolling consistency chart. Drag horizontally to inspect a score." style={styles.frame}>
          <CartesianChart<RegularityChartPoint, 'date', 'composite'>
            chartPressConfig={{ pan: { activateAfterLongPress: 0 } }}
            chartPressState={state}
            data={model.data}
            domain={{ y: model.domain }}
            domainPadding={{ left: 10, right: 10 }}
            frame={{ lineColor: 'transparent', lineWidth: { bottom: 0, left: 0, right: 0, top: 0 } }}
            padding={METRICS_CHART_PADDING}
            xKey="date"
            yKeys={['composite']}
          >
            {({ chartBounds, points, xScale, yScale }) => (
              <>
                <CompositeArea baseline={model.domain[0]} points={points.composite} yScale={yScale} />
                <CompositeLine points={points.composite} />
                {points.composite.map((point) => (
                  <Circle color={teal} cx={point.x} cy={point.y ?? chartBounds.bottom} key={String(point.xValue)} r={3.4} />
                ))}
                <Line
                  color="rgba(190,198,208,0.8)"
                  p1={vec(chartBounds.left, yScale(80))}
                  p2={vec(chartBounds.right, yScale(80))}
                  strokeWidth={1}
                >
                  <DashPathEffect intervals={[4, 4]} />
                </Line>
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
            ticks={scoreTicks(model.domain)}
          />
          {hasSelection && selected ? (
            <ChartSelectionBubble
              accent={teal}
              date={selected.date}
              lines={<Text style={[styles.selectionText, { color: theme.textPrimary }]}>{selected.composite}%</Text>}
            />
          ) : null}
        </View>
      )}
    </MetricsChartCard>
  );
}

function CompositeArea({ baseline, points, yScale }: { baseline: number; points: PointsArray; yScale(value: number): number }) {
  const clean = useCleanPoints(points);
  const path = useMemo(() => createLinearAreaPath(clean, yScale(baseline)), [baseline, clean, yScale]);
  return <Path color={teal} opacity={0.2} path={path} />;
}

function CompositeLine({ points }: { points: PointsArray }) {
  const clean = useCleanPoints(points);
  const path = useMemo(() => createCatmullRomPath(clean), [clean]);
  return <Path color={teal} path={path} strokeWidth={3} style="stroke" />;
}

function useCleanPoints(points: PointsArray) {
  return useMemo(
    () => points.flatMap((point) => typeof point.y === 'number' ? [{ x: point.x, y: point.y }] : []),
    [points],
  );
}

function ChartUnavailable({ nightsNeeded }: { nightsNeeded: number }) {
  const { theme } = useTheme();
  return (
    <View accessibilityRole="summary" style={styles.unavailable}>
      <Text style={[styles.unavailableValue, { color: theme.textPrimary }]}>{nightsNeeded}</Text>
      <Text style={[styles.unavailableCopy, { color: theme.textSecondary }]}>more {nightsNeeded === 1 ? 'night' : 'nights'} to unlock the 14-night trend</Text>
    </View>
  );
}

function scoreTicks(domain: [number, number]): number[] {
  return [domain[1], 80, domain[0]].filter((value, index, values) => values.indexOf(value) === index);
}

const styles = StyleSheet.create({
  frame: { height: METRICS_CHART_HEIGHT, overflow: 'hidden' },
  selectionText: { fontSize: 14, fontWeight: '800' },
  unavailable: { alignItems: 'center', height: 180, justifyContent: 'center', paddingHorizontal: 24 },
  unavailableCopy: { fontSize: 13, lineHeight: 18, marginTop: 4, textAlign: 'center' },
  unavailableValue: { fontSize: 32, fontWeight: '800' },
});
