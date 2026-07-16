import { Circle, DashPathEffect, Line, Path, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CartesianChart, useChartPressState, type PointsArray } from 'victory-native';

import {
  createMovingAverageChartModel,
  type MovingAverageAreaSegment,
  type MovingAverageChartPoint,
} from '@/components/charts/dashboard-chart-models';
import { createCatmullRomPath, createLinearAreaPath } from '@/components/charts/skia-chart-paths';
import { usePersistentChartSelection } from '@/components/charts/use-persistent-chart-selection';
import type { SleepNightRecord } from '@/domain/metrics/core';
import { useTheme } from '@/theme/ThemeProvider';

const chartHeight = 220;
const chartPadding = { bottom: 28, left: 38, right: 8, top: 10 } as const;

export function MovingAverageCard({
  records,
  targetDurationHours,
}: {
  records: readonly SleepNightRecord[];
  targetDurationHours: number;
}) {
  const { theme } = useTheme();
  const model = useMemo(
    () => createMovingAverageChartModel(records, targetDurationHours),
    [records, targetDurationHours],
  );
  const { state } = useChartPressState({
    x: model.data.at(-1)?.date ?? 0,
    y: { movingAverageHours: 0 },
  });
  const { hasSelection, selectedIndex } = usePersistentChartSelection(state, model.data.length);

  const selected = model.data[selectedIndex];
  const labels = sampleDateLabels(model.data);
  if (model.data.length < 2) {
    return (
      <View style={[styles.frame, styles.insufficient]}>
        <Text style={[styles.insufficientValue, { color: theme.textPrimary }]}>
          {model.data[0] ? `${model.data[0].movingAverageHours.toFixed(1)}h` : `${Math.max(0, 7 - records.length)} nights`}
        </Text>
        <Text style={[styles.insufficientLabel, { color: theme.textSecondary }]}>
          {model.data[0] ? 'First rolling average - one more night starts the trend' : 'Keep tracking to unlock your 7-night average'}
        </Text>
      </View>
    );
  }
  return (
    <View accessibilityLabel="Seven night moving average chart. Drag horizontally to inspect a date." style={styles.frame}>
      <CartesianChart<MovingAverageChartPoint, 'date', 'movingAverageHours'>
        chartPressConfig={{ pan: { activateAfterLongPress: 0 } }}
        chartPressState={state}
        data={model.data}
        domain={{ y: model.domain }}
        frame={{ lineColor: 'transparent', lineWidth: { bottom: 0, left: 0, right: 0, top: 0 } }}
        padding={chartPadding}
        xKey="date"
        yKeys={['movingAverageHours']}
      >
        {({ chartBounds, points, xScale, yScale }) => (
          <>
            {model.segments.map((segment, index) => (
              <AreaSegment
                color={segment.band === 'above' ? theme.success : '#ff453a'}
                key={`${segment.band}-${index}`}
                segment={segment}
                targetDurationHours={targetDurationHours}
                xScale={xScale}
                yScale={yScale}
              />
            ))}
            <Line
              color="rgba(210,216,222,0.8)"
              p1={vec(chartBounds.left, yScale(targetDurationHours))}
              p2={vec(chartBounds.right, yScale(targetDurationHours))}
              strokeWidth={1.2}
            >
              <DashPathEffect intervals={[4, 4]} />
            </Line>
            <AverageLine color={theme.actionPrimary} points={points.movingAverageHours} />
            {hasSelection && selected ? (
              <>
                <Line
                  color="rgba(255,255,255,0.4)"
                  p1={vec(xScale(selected.date), chartBounds.top)}
                  p2={vec(xScale(selected.date), chartBounds.bottom)}
                  strokeWidth={1.4}
                >
                  <DashPathEffect intervals={[2, 3]} />
                </Line>
                <Circle
                  color="#ffffff"
                  cx={xScale(selected.date)}
                  cy={yScale(selected.movingAverageHours)}
                  r={Math.sqrt(56 / Math.PI)}
                />
              </>
            ) : null}
          </>
        )}
      </CartesianChart>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <DurationAxis domain={model.domain} />
        <DateAxis data={model.data} labels={labels} />
        {hasSelection && selected ? (
          <SelectionLabel date={selected.date} value={`${selected.movingAverageHours.toFixed(1)}h`} />
        ) : null}
      </View>
    </View>
  );
}

function AreaSegment({
  color,
  segment,
  targetDurationHours,
  xScale,
  yScale,
}: {
  color: string;
  segment: MovingAverageAreaSegment;
  targetDurationHours: number;
  xScale(value: number): number;
  yScale(value: number): number;
}) {
  const points = useMemo(
    () => segment.points.map((point) => ({ x: xScale(point.date), y: yScale(point.movingAverageHours) })),
    [segment.points, xScale, yScale],
  );
  const path = useMemo(
    () => createLinearAreaPath(points, yScale(targetDurationHours)),
    [points, targetDurationHours, yScale],
  );
  return <Path color={color} opacity={0.22} path={path} />;
}

function AverageLine({ color, points }: { color: string; points: PointsArray }) {
  const clean = useMemo(
    () => points.flatMap((point) => (
      typeof point.y === 'number' ? [{ x: point.x, y: point.y }] : []
    )),
    [points],
  );
  const path = useMemo(() => createCatmullRomPath(clean), [clean]);
  return <Path color={color} path={path} strokeWidth={3} style="stroke" />;
}

function DurationAxis({ domain }: { domain: [number, number] }) {
  const { theme } = useTheme();
  const middle = (domain[0] + domain[1]) / 2;
  return (
    <>
      {[domain[1], middle, domain[0]].map((value, index) => (
        <Text
          key={`${value}-${index}`}
          style={[
            styles.axisLabel,
            { color: theme.textSecondary, top: axisTop(value, domain) },
          ]}
        >
          {value.toFixed(1)}h
        </Text>
      ))}
    </>
  );
}

function DateAxis({
  data,
  labels,
}: {
  data: readonly MovingAverageChartPoint[];
  labels: readonly MovingAverageChartPoint[];
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.dateLabels}>
      {labels.map((point, index) => (
        <Text
          key={point.dayKey}
          style={[
            styles.dateLabel,
            dateLabelPosition(point.date, data, index, labels.length),
            { color: theme.textSecondary },
          ]}
        >
          {formatShortDate(point.date)}
        </Text>
      ))}
    </View>
  );
}

function SelectionLabel({ date, value }: { date: number; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.selection, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.selectionDate, { color: theme.textSecondary }]}>{formatShortDate(date)}</Text>
      <Text style={[styles.selectionValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

function sampleDateLabels(data: readonly MovingAverageChartPoint[]): MovingAverageChartPoint[] {
  if (data.length <= 5) return [...data];
  return Array.from({ length: 5 }, (_, index) => data[Math.round((index / 4) * (data.length - 1))]);
}

function formatShortDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'short' }).format(timestamp);
}

function dateLabelPosition(
  date: number,
  data: readonly MovingAverageChartPoint[],
  index: number,
  labelCount: number,
) {
  if (labelCount === 1) return { left: '50%' as const, transform: [{ translateX: -22 }] };
  if (index === 0) return { left: 0 };
  if (index === labelCount - 1) return { right: 0 };
  const first = data[0]?.date ?? date;
  const last = data.at(-1)?.date ?? date;
  const percent = last === first ? 50 : ((date - first) / (last - first)) * 100;
  return { left: `${percent}%` as `${number}%`, transform: [{ translateX: -22 }] };
}

function axisTop(value: number, domain: [number, number]): number {
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  return chartPadding.top + ((domain[1] - value) / (domain[1] - domain[0])) * plotHeight - 7;
}

const styles = StyleSheet.create({
  axisLabel: { fontSize: 10, fontWeight: '700', left: 0, position: 'absolute' },
  dateLabel: { fontSize: 9, fontWeight: '600', position: 'absolute', textAlign: 'center', width: 44 },
  dateLabels: { bottom: 0, height: 14, left: chartPadding.left, position: 'absolute', right: chartPadding.right },
  frame: { height: chartHeight, overflow: 'hidden', width: '100%' },
  insufficient: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  insufficientLabel: { fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: 'center' },
  insufficientValue: { fontSize: 32, fontWeight: '800' },
  selection: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, position: 'absolute', right: 10, top: 10 },
  selectionDate: { fontSize: 9, fontWeight: '700' },
  selectionValue: { fontSize: 15, fontWeight: '800', marginTop: 1 },
});
