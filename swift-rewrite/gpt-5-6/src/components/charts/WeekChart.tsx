import {
  Circle,
  DashPathEffect,
  Group,
  Line as SkiaLine,
  Path,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  CartesianChart,
  useChartPressState,
  type ChartBounds,
  type PointsArray,
} from 'victory-native';

import {
  createWeekChartModel,
  deviationBand,
  formatChartClock,
  shouldHideClockTick,
  type WeekChartDatum,
  type WeekChartRule,
} from '@/components/charts/week-chart-model';
import { createCatmullRomPath } from '@/components/charts/skia-chart-paths';
import { usePersistentChartSelection } from '@/components/charts/use-persistent-chart-selection';
import type { SleepNightRecord } from '@/domain/metrics/core';
import { useTheme } from '@/theme/ThemeProvider';

const chartHeight = 255;
const chartPadding = { bottom: 42, left: 42, right: 54, top: 14 } as const;
const chartDomain = { x: [-0.5, 6.5] as [number, number], y: [0, 12] as [number, number] };
const clockTicks = [12, 8, 4, 0] as const;
const durationTicks = [12, 8, 4, 0] as const;

export function WeekChart({
  records,
  targetDurationHours,
  targetSleepOffset,
  targetWakeOffset,
}: {
  records: readonly SleepNightRecord[];
  targetDurationHours: number;
  targetSleepOffset: number;
  targetWakeOffset: number;
}) {
  const { theme } = useTheme();
  const model = useMemo(
    () => createWeekChartModel(records, targetSleepOffset, targetWakeOffset),
    [records, targetSleepOffset, targetWakeOffset],
  );
  const { state } = useChartPressState({
    x: Math.max(0, model.data.length - 1),
    y: { bedtimeChartHour: 0, durationHours: 0, wakeChartHour: 0 },
  });
  const { hasSelection, selectedIndex } = usePersistentChartSelection(state, model.data.length);

  const selected = model.data[selectedIndex];
  return (
    <View accessibilityLabel="Seven night sleep chart. Drag horizontally to inspect a night." style={styles.frame}>
      <CartesianChart<
        WeekChartDatum,
        'index',
        'durationHours' | 'bedtimeChartHour' | 'wakeChartHour'
      >
        chartPressConfig={{ pan: { activateAfterLongPress: 0 } }}
        chartPressState={state}
        data={model.data}
        domain={chartDomain}
        domainPadding={{ bottom: 6, left: 18, right: 18, top: 6 }}
        frame={{
          lineColor: 'transparent',
          lineWidth: { bottom: 0, left: 0, right: 0, top: 0 },
        }}
        padding={chartPadding}
        xKey="index"
        yKeys={['durationHours', 'bedtimeChartHour', 'wakeChartHour']}
      >
        {({ chartBounds, points, xScale, yScale }) => (
          <Group>
            {[2, 6, 10].map((value) => (
              <GridLine chartBounds={chartBounds} key={value} y={yScale(value)} />
            ))}
            <RuleLine chartBounds={chartBounds} color="rgba(190,198,208,0.8)" rule={model.rules.duration} yScale={yScale} />
            <RuleLine chartBounds={chartBounds} color="#7b7cff" rule={model.rules.sleep} yScale={yScale} />
            <RuleLine chartBounds={chartBounds} color={theme.warning} rule={model.rules.wake} yScale={yScale} />

            {model.data.map((datum) => {
              const top = yScale(datum.bedtimeChartHour);
              const bottom = yScale(datum.wakeChartHour);
              return (
                <RoundedRect
                  color={theme.accent}
                  height={Math.max(0, bottom - top)}
                  key={datum.dayKey}
                  opacity={0.7}
                  r={4}
                  width={25}
                  x={xScale(datum.index) - 12.5}
                  y={top}
                />
              );
            })}

            <DurationLine points={points.durationHours} />
            {points.durationHours.map((point) => (
              <Circle
                color="rgba(190,198,208,0.72)"
                cx={point.x}
                cy={point.y ?? chartBounds.bottom}
                key={String(point.xValue)}
                r={Math.sqrt(30 / Math.PI)}
              />
            ))}
            {hasSelection && selected ? (
              <SkiaLine
                color="rgba(255,255,255,0.3)"
                p1={vec(xScale(selected.index), chartBounds.top)}
                p2={vec(xScale(selected.index), chartBounds.bottom)}
                strokeWidth={2}
              />
            ) : null}
          </Group>
        )}
      </CartesianChart>

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <AxisLabels durationRule={model.rules.duration} sleepRule={model.rules.sleep} wakeRule={model.rules.wake} />
        <XAxisLabels data={model.data} />
        {hasSelection && selected ? (
          <SelectionPopover
            datum={selected}
            itemCount={model.data.length}
            targetDurationHours={targetDurationHours}
          />
        ) : null}
      </View>
    </View>
  );
}

function DurationLine({ points }: { points: PointsArray }) {
  const clean = useMemo(
    () => points.flatMap((point) => (
      typeof point.y === 'number' ? [{ x: point.x, y: point.y }] : []
    )),
    [points],
  );
  const path = useMemo(() => createCatmullRomPath(clean), [clean]);
  return <Path color="rgba(190,198,208,0.3)" path={path} strokeWidth={3} style="stroke" />;
}

function GridLine({ chartBounds, y }: { chartBounds: ChartBounds; y: number }) {
  return (
    <SkiaLine
      color="rgba(255,255,255,0.12)"
      p1={vec(chartBounds.left, y)}
      p2={vec(chartBounds.right, y)}
      strokeWidth={1}
    />
  );
}

function RuleLine({
  chartBounds,
  color,
  rule,
  yScale,
}: {
  chartBounds: ChartBounds;
  color: string;
  rule: WeekChartRule;
  yScale(value: number): number;
}) {
  const y = yScale(rule.chartHour);
  return (
    <SkiaLine color={color} p1={vec(chartBounds.left, y)} p2={vec(chartBounds.right, y)} strokeWidth={2}>
      <DashPathEffect intervals={[4, 4]} />
    </SkiaLine>
  );
}

function AxisLabels({
  durationRule,
  sleepRule,
  wakeRule,
}: {
  durationRule: WeekChartRule;
  sleepRule: WeekChartRule;
  wakeRule: WeekChartRule;
}) {
  const { theme } = useTheme();
  const timeRules = [sleepRule.chartHour, wakeRule.chartHour];
  return (
    <>
      {durationTicks.map((tick) => (
        shouldHideClockTick(tick, [durationRule.chartHour]) ? null : (
          <Text key={`duration-${tick}`} style={[styles.axisLabel, styles.leftAxis, { color: theme.textSecondary, top: axisTop(tick) }]}>
            {tick}h
          </Text>
        )
      ))}
      {clockTicks.map((tick) => (
        shouldHideClockTick(tick, timeRules) ? null : (
          <Text key={`clock-${tick}`} style={[styles.axisLabel, styles.rightAxis, { color: theme.accent, top: axisTop(tick) }]}>
            {formatChartClock(tick)}
          </Text>
        )
      ))}
      <RuleAnnotation color="rgba(210,216,222,0.92)" label={durationRule.label} side="left" value={durationRule.chartHour} />
      <RuleAnnotation color="#7b7cff" label={sleepRule.label} side="right" value={sleepRule.chartHour} />
      <RuleAnnotation color={theme.warning} label={wakeRule.label} side="right" value={wakeRule.chartHour} />
    </>
  );
}

function RuleAnnotation({
  color,
  label,
  side,
  value,
}: {
  color: string;
  label: string;
  side: 'left' | 'right';
  value: number;
}) {
  return (
    <Text
      style={[
        styles.ruleLabel,
        side === 'left' ? styles.leftAxis : styles.rightAxis,
        { color, top: axisTop(value) },
      ]}
    >
      {label}
    </Text>
  );
}

function XAxisLabels({ data }: { data: readonly WeekChartDatum[] }) {
  const { theme } = useTheme();
  return (
    <View style={styles.xLabels}>
      {data.map((datum) => (
        <View key={datum.dayKey} style={styles.xLabel}>
          <Text style={[styles.xDay, { color: theme.textSecondary }]}>{datum.day}</Text>
          <Text style={[styles.xDuration, { color: theme.textSecondary }]}>{datum.durationLabel}</Text>
        </View>
      ))}
    </View>
  );
}

function SelectionPopover({
  datum,
  itemCount,
  targetDurationHours,
}: {
  datum: WeekChartDatum;
  itemCount: number;
  targetDurationHours: number;
}) {
  const { theme } = useTheme();
  const band = deviationBand(datum.durationHours, targetDurationHours);
  const color = band === 'success' ? theme.success : band === 'warning' ? '#ffd60a' : theme.accent;
  const percent = itemCount <= 1 ? 50 : (datum.index / (itemCount - 1)) * 100;
  const horizontal = datum.index === 0
    ? { left: 0 }
    : datum.index === itemCount - 1
      ? { right: 0 }
      : { left: `${percent}%` as `${number}%`, transform: [{ translateX: -70 }] };
  return (
    <View style={[styles.popover, horizontal, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.popoverDay, { color: theme.textPrimary }]}>{datum.day}</Text>
      <Text style={[styles.popoverValue, { color }]}>{datum.durationLabel}</Text>
      <Text style={[styles.popoverDetail, { color: theme.textSecondary }]}>sleep duration</Text>
    </View>
  );
}

function axisTop(value: number): number {
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  return chartPadding.top + ((12 - value) / 12) * plotHeight - 7;
}

const styles = StyleSheet.create({
  axisLabel: { fontSize: 11, fontWeight: '800', position: 'absolute' },
  frame: { height: chartHeight, overflow: 'hidden', width: '100%' },
  leftAxis: { left: 0, width: 38 },
  popover: {
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    top: 20,
    width: 140,
  },
  popoverDay: { fontSize: 11, fontWeight: '800' },
  popoverDetail: { fontSize: 9, marginTop: 1 },
  popoverValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  rightAxis: { right: 0, textAlign: 'right', width: 50 },
  ruleLabel: { fontSize: 9, fontWeight: '800', position: 'absolute' },
  xDay: { fontSize: 11, fontWeight: '800' },
  xDuration: { fontSize: 9, fontWeight: '500', marginTop: 2 },
  xLabel: { alignItems: 'center', flex: 1 },
  xLabels: { bottom: 0, flexDirection: 'row', left: chartPadding.left, position: 'absolute', right: chartPadding.right },
});
