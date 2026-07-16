// ports: twilight/views/sleepmetricsview.swift

import { Circle, DashPathEffect, Line, Path, RoundedRect, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CartesianChart, useChartPressState, type ChartBounds, type PointsArray } from 'victory-native';

import {
  ChartSelectionBubble,
  METRICS_CHART_HEIGHT,
  METRICS_CHART_PADDING,
  MetricsChartAxes,
  MetricsChartCard,
} from '@/components/charts/MetricsChartCard';
import {
  createDurationMomentumModel,
  type DurationMomentumPoint,
} from '@/components/charts/metrics-chart-models';
import { createCatmullRomPath } from '@/components/charts/skia-chart-paths';
import { usePersistentChartSelection } from '@/components/charts/use-persistent-chart-selection';
import type { SleepNightRecord } from '@/domain/metrics/core';
import { useTheme } from '@/theme/ThemeProvider';

const domain = [0, 12] as [number, number];

export function DurationMomentumChart({
  records,
  targetDurationHours,
}: {
  records: readonly SleepNightRecord[];
  targetDurationHours: number;
}) {
  const { theme } = useTheme();
  const model = useMemo(
    () => createDurationMomentumModel(records, targetDurationHours),
    [records, targetDurationHours],
  );
  const { state } = useChartPressState({
    x: model.data.at(-1)?.date ?? 0,
    y: { durationHours: 0, rollingAverageHours: 0 },
  });
  const { hasSelection, selectedIndex } = usePersistentChartSelection(state, model.data.length);
  const selected = model.data[selectedIndex];

  return (
    <MetricsChartCard
      subtitle="Bars are each tracked night. Line smooths short-term noise."
      title="Daily Duration + 7-Night Moving Average"
    >
      <View accessibilityLabel="Duration momentum chart. Drag horizontally to inspect a night." style={styles.frame}>
        <CartesianChart<DurationMomentumPoint, 'date', 'durationHours' | 'rollingAverageHours'>
          chartPressConfig={{ pan: { activateAfterLongPress: 0 } }}
          chartPressState={state}
          data={model.data}
          domain={{ y: domain }}
          domainPadding={{ left: 8, right: 8 }}
          frame={{ lineColor: 'transparent', lineWidth: { bottom: 0, left: 0, right: 0, top: 0 } }}
          padding={METRICS_CHART_PADDING}
          xKey="date"
          yKeys={['durationHours', 'rollingAverageHours']}
        >
          {({ chartBounds, points, xScale, yScale }) => {
            const barWidth = Math.max(3, Math.min(16, ((chartBounds.right - chartBounds.left) / Math.max(1, model.data.length)) * 0.62));
            const averagePoints = points.rollingAverageHours.slice(model.averageStartIndex);
            return (
              <>
                <GridLines chartBounds={chartBounds} yScale={yScale} />
                {model.data.map((point) => {
                  const top = yScale(point.durationHours);
                  const bottom = yScale(0);
                  return (
                    <RoundedRect
                      color={point.targetBand === 'at-or-above' ? theme.success : theme.warning}
                      height={bottom - top}
                      key={point.dayKey}
                      opacity={point.targetBand === 'at-or-above' ? 0.68 : 0.65}
                      r={4}
                      width={barWidth}
                      x={xScale(point.date) - barWidth / 2}
                      y={top}
                    />
                  );
                })}
                <Line
                  color="rgba(190,198,208,0.8)"
                  p1={vec(chartBounds.left, yScale(targetDurationHours))}
                  p2={vec(chartBounds.right, yScale(targetDurationHours))}
                  strokeWidth={1.5}
                >
                  <DashPathEffect intervals={[4, 4]} />
                </Line>
                <AverageLine color={theme.actionPrimary} points={averagePoints} />
                {averagePoints.map((point) => (
                  <Circle color={theme.actionPrimary} cx={point.x} cy={point.y ?? chartBounds.bottom} key={String(point.xValue)} r={2.4} />
                ))}
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
            );
          }}
        </CartesianChart>
        <MetricsChartAxes data={model.data} domain={domain} formatY={(value) => `${value}h`} ticks={[12, 8, 4, 0]} />
        {hasSelection && selected ? (
          <ChartSelectionBubble
            accent={selected.targetBand === 'at-or-above' ? theme.success : theme.warning}
            date={selected.date}
            lines={<Text style={[styles.selectionText, { color: theme.textPrimary }]}>{selected.durationHours.toFixed(1)}h</Text>}
          />
        ) : null}
      </View>
    </MetricsChartCard>
  );
}

function AverageLine({ color, points }: { color: string; points: PointsArray }) {
  const clean = useMemo(
    () => points.flatMap((point) => typeof point.y === 'number' ? [{ x: point.x, y: point.y }] : []),
    [points],
  );
  const path = useMemo(() => createCatmullRomPath(clean), [clean]);
  return <Path color={color} path={path} strokeWidth={2.5} style="stroke" />;
}

function GridLines({ chartBounds, yScale }: { chartBounds: ChartBounds; yScale(value: number): number }) {
  return [4, 8, 12].map((value) => (
    <Line
      color="rgba(255,255,255,0.1)"
      key={value}
      p1={vec(chartBounds.left, yScale(value))}
      p2={vec(chartBounds.right, yScale(value))}
      strokeWidth={1}
    />
  ));
}

const styles = StyleSheet.create({
  frame: { height: METRICS_CHART_HEIGHT, overflow: 'hidden' },
  selectionText: { fontSize: 14, fontWeight: '800' },
});
