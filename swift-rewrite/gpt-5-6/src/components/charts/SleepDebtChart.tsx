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
  createDebtChartModel,
  type DebtChartPoint,
} from '@/components/charts/metrics-chart-models';
import { createLinearAreaPath, createLinearPath } from '@/components/charts/skia-chart-paths';
import { usePersistentChartSelection } from '@/components/charts/use-persistent-chart-selection';
import type { SleepNightRecord } from '@/domain/metrics/core';
import { useTheme } from '@/theme/ThemeProvider';

export function SleepDebtChart({
  records,
  targetDurationHours,
}: {
  records: readonly SleepNightRecord[];
  targetDurationHours: number;
}) {
  const { theme } = useTheme();
  const model = useMemo(
    () => createDebtChartModel(records, targetDurationHours),
    [records, targetDurationHours],
  );
  const { state } = useChartPressState({ x: model.data.at(-1)?.date ?? 0, y: { cumulativeHours: 0 } });
  const { hasSelection, selectedIndex } = usePersistentChartSelection(state, model.data.length);
  const selected = model.data[selectedIndex];

  return (
    <MetricsChartCard
      subtitle="Tracks running surplus or deficit against your goal duration."
      title="Cumulative Sleep Debt / Credit"
    >
      <View accessibilityLabel="Cumulative sleep debt chart. Drag horizontally to inspect a night." style={styles.frame}>
        <CartesianChart<DebtChartPoint, 'date', 'cumulativeHours'>
          chartPressConfig={{ pan: { activateAfterLongPress: 0 } }}
          chartPressState={state}
          data={model.data}
          domain={{ y: model.domain }}
          domainPadding={{ left: 8, right: 8 }}
          frame={{ lineColor: 'transparent', lineWidth: { bottom: 0, left: 0, right: 0, top: 0 } }}
          padding={METRICS_CHART_PADDING}
          xKey="date"
          yKeys={['cumulativeHours']}
        >
          {({ chartBounds, points, xScale, yScale }) => (
            <>
              <DebtArea baseline={yScale(0)} color={theme.accent} points={points.cumulativeHours} />
              <DebtLine color={theme.accent} points={points.cumulativeHours} />
              <Line
                color="rgba(190,198,208,0.8)"
                p1={vec(chartBounds.left, yScale(0))}
                p2={vec(chartBounds.right, yScale(0))}
                strokeWidth={1}
              >
                <DashPathEffect intervals={[4, 4]} />
              </Line>
              {hasSelection && selected ? (
                <>
                  <Line
                    color="rgba(255,255,255,0.45)"
                    p1={vec(xScale(selected.date), chartBounds.top)}
                    p2={vec(xScale(selected.date), chartBounds.bottom)}
                    strokeWidth={1}
                  >
                    <DashPathEffect intervals={[2, 3]} />
                  </Line>
                  <Circle color={theme.accent} cx={xScale(selected.date)} cy={yScale(selected.cumulativeHours)} r={3.8} />
                </>
              ) : null}
            </>
          )}
        </CartesianChart>
        <MetricsChartAxes
          data={model.data}
          domain={model.domain}
          formatY={formatSignedHours}
          ticks={[model.domain[1], 0, model.domain[0]]}
        />
        {hasSelection && selected ? (
          <ChartSelectionBubble
            accent={theme.accent}
            date={selected.date}
            lines={<Text style={[styles.selectionText, { color: theme.textPrimary }]}>{formatSignedHours(selected.cumulativeHours)}</Text>}
          />
        ) : null}
      </View>
    </MetricsChartCard>
  );
}

function DebtArea({ baseline, color, points }: { baseline: number; color: string; points: PointsArray }) {
  const clean = useCleanPoints(points);
  const path = useMemo(() => createLinearAreaPath(clean, baseline), [baseline, clean]);
  return <Path color={color} opacity={0.18} path={path} />;
}

function DebtLine({ color, points }: { color: string; points: PointsArray }) {
  const clean = useCleanPoints(points);
  const path = useMemo(() => createLinearPath(clean), [clean]);
  return <Path color={color} path={path} strokeWidth={2.5} style="stroke" />;
}

function useCleanPoints(points: PointsArray) {
  return useMemo(
    () => points.flatMap((point) => typeof point.y === 'number' ? [{ x: point.x, y: point.y }] : []),
    [points],
  );
}

function formatSignedHours(value: number): string {
  return `${value >= 0 ? '+' : ''}${Math.round(value)}h`;
}

const styles = StyleSheet.create({
  frame: { height: METRICS_CHART_HEIGHT, overflow: 'hidden' },
  selectionText: { fontSize: 13, fontWeight: '800' },
});
