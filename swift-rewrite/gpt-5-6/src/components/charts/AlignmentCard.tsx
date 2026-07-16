import { Circle, DashPathEffect, Line, Path, RoundedRect, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CartesianChart, useChartPressState, type PointsArray } from 'victory-native';

import {
  createAlignmentChartModel,
  type AlignmentCardMode,
  type AlignmentChartPoint,
} from '@/components/charts/dashboard-chart-models';
import { AlignmentCardHeader, AlignmentCardSelection } from '@/components/charts/alignment-card-details';
import { createCatmullRomPath } from '@/components/charts/skia-chart-paths';
import { usePersistentChartSelection } from '@/components/charts/use-persistent-chart-selection';
import type { SleepNightRecord } from '@/domain/metrics/core';
import { useTheme } from '@/theme/ThemeProvider';

const chartHeight = 220;
const chartPadding = { bottom: 28, left: 34, right: 8, top: 10 } as const;
const scoreTicks = [0, 25, 50, 70, 100] as const;
const targetScore = 70;

export function AlignmentCard({
  mode = 'score',
  records,
  targetDurationHours,
  targetSleepOffset,
}: {
  mode?: AlignmentCardMode;
  records: readonly SleepNightRecord[];
  targetDurationHours: number;
  targetSleepOffset: number;
}) {
  const { theme } = useTheme();
  const data = useMemo(
    () => createAlignmentChartModel(records, targetDurationHours, targetSleepOffset, mode),
    [mode, records, targetDurationHours, targetSleepOffset],
  );
  const { state } = useChartPressState({
    x: data.at(-1)?.date ?? 0,
    y: { dailyScore: 0, trendScore: 0 },
  });
  const { hasSelection, selectedIndex } = usePersistentChartSelection(state, data.length);

  const selected = hasSelection ? data[selectedIndex] : data.at(-1);
  const labels = sampleDateLabels(data);
  return (
    <View style={styles.container}>
      <AlignmentCardHeader data={data} mode={mode} selected={selected} />
      <View
        accessibilityLabel={`${mode === 'score' ? 'Sleep alignment' : 'Core sleep'} score chart. Drag horizontally to inspect a date.`}
        style={styles.frame}
      >
      <CartesianChart<AlignmentChartPoint, 'date', 'dailyScore' | 'trendScore'>
        chartPressConfig={{ pan: { activateAfterLongPress: 0 } }}
        chartPressState={state}
        data={data}
        domain={{ y: [0, 100] }}
        domainPadding={{ left: 8, right: 8 }}
        frame={{ lineColor: 'transparent', lineWidth: { bottom: 0, left: 0, right: 0, top: 0 } }}
        padding={chartPadding}
        xKey="date"
        yKeys={['dailyScore', 'trendScore']}
      >
        {({ chartBounds, points, xScale, yScale }) => {
          const barWidth = Math.max(4, Math.min(18, ((chartBounds.right - chartBounds.left) / Math.max(1, data.length)) * 0.62));
          return (
            <>
              {data.map((point) => {
                const top = yScale(point.dailyScore);
                const bottom = yScale(0);
                const meetsTarget = point.dailyScore >= targetScore;
                return (
                  <RoundedRect
                    color={meetsTarget ? theme.success : theme.warning}
                    height={bottom - top}
                    key={point.dayKey}
                    opacity={meetsTarget ? 0.68 : 0.65}
                    r={4}
                    width={barWidth}
                    x={xScale(point.date) - barWidth / 2}
                    y={top}
                  />
                );
              })}
              <Line
                color={theme.success}
                p1={vec(chartBounds.left, yScale(targetScore))}
                p2={vec(chartBounds.right, yScale(targetScore))}
                strokeWidth={1.2}
              >
                <DashPathEffect intervals={[4, 4]} />
              </Line>
              <TrendLine color={theme.actionPrimary} points={points.trendScore} />
              {selected ? (
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
                    cy={yScale(selected.trendScore)}
                    r={Math.sqrt(56 / Math.PI)}
                  />
                </>
              ) : null}
            </>
          );
        }}
      </CartesianChart>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <ScoreAxis />
        <DateAxis data={data} labels={labels} />
        {selected ? (
          <SelectionLabel date={selected.date} score={selected.dailyScore} />
        ) : null}
      </View>
      </View>
      {selected ? <AlignmentCardSelection mode={mode} selected={selected} /> : (
        <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>Track a completed night to unlock your alignment trend.</Text>
      )}
    </View>
  );
}

function TrendLine({ color, points }: { color: string; points: PointsArray }) {
  const clean = useMemo(
    () => points.flatMap((point) => (
      typeof point.y === 'number' ? [{ x: point.x, y: point.y }] : []
    )),
    [points],
  );
  const path = useMemo(() => createCatmullRomPath(clean), [clean]);
  return <Path color={color} path={path} strokeWidth={3} style="stroke" />;
}

function ScoreAxis() {
  const { theme } = useTheme();
  return (
    <>
      {[...scoreTicks].reverse().map((value) => (
        <Text
          key={value}
          style={[styles.axisLabel, { color: value === targetScore ? theme.success : theme.textSecondary, top: axisTop(value) }]}
        >
          {value}
        </Text>
      ))}
    </>
  );
}

function DateAxis({
  data,
  labels,
}: {
  data: readonly AlignmentChartPoint[];
  labels: readonly AlignmentChartPoint[];
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

function SelectionLabel({ date, score }: { date: number; score: number }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.selection, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.selectionDate, { color: theme.textSecondary }]}>{formatShortDate(date)}</Text>
      <Text style={[styles.selectionValue, { color: score >= targetScore ? theme.success : theme.warning }]}>
        {Math.round(score)}
      </Text>
    </View>
  );
}

function sampleDateLabels(data: readonly AlignmentChartPoint[]): AlignmentChartPoint[] {
  if (data.length <= 5) return [...data];
  return Array.from({ length: 5 }, (_, index) => data[Math.round((index / 4) * (data.length - 1))]);
}

function formatShortDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'short' }).format(timestamp);
}

function dateLabelPosition(
  date: number,
  data: readonly AlignmentChartPoint[],
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

function axisTop(value: number): number {
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  return chartPadding.top + ((100 - value) / 100) * plotHeight - 7;
}

const styles = StyleSheet.create({
  axisLabel: { fontSize: 10, fontWeight: '700', left: 0, position: 'absolute' },
  container: { gap: 12, width: '100%' },
  dateLabel: { fontSize: 9, fontWeight: '600', position: 'absolute', textAlign: 'center', width: 44 },
  dateLabels: { bottom: 0, height: 14, left: chartPadding.left, position: 'absolute', right: chartPadding.right },
  emptyCopy: { fontSize: 13, lineHeight: 19, paddingVertical: 24 },
  frame: { height: chartHeight, overflow: 'hidden', width: '100%' },
  selection: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, position: 'absolute', right: 10, top: 10 },
  selectionDate: { fontSize: 9, fontWeight: '700' },
  selectionValue: { fontSize: 15, fontWeight: '800', marginTop: 1 },
});
