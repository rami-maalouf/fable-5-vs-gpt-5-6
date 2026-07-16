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
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { CartesianChart, Line, type ChartBounds, useChartPressState } from 'victory-native';

import { CardBackground } from '@/components/common';
import { rgba } from '@/components/common/color';
import { Spacing } from '@/constants/theme';
import type { SleepSettings } from '@/domain/models';
import type { SleepNightRecord } from '@/domain/metrics/core';
import type { AppTheme } from '@/theme';

import {
  buildWeekChartData,
  buildWeekChartRules,
  buildWeekChartStats,
  calculateWeekChartDomain,
  deviationColor,
  deviationMinutes,
  formatDeviation,
  offsetHoursToClockLabel,
  type WeekChartDatum,
  type WeekChartDomain,
} from './week-chart-model';

type WeekChartProps = {
  records: readonly SleepNightRecord[];
  settings: SleepSettings;
  theme: AppTheme;
};

const chartHeight = 300;
const collisionThresholdHours = 31 / 60;

function yPosition(value: number, bounds: ChartBounds, domain: WeekChartDomain) {
  const ratio = (domain.top - value) / (domain.top - domain.bottom);
  return bounds.top + ratio * (bounds.bottom - bounds.top);
}

function formatAverageDuration(hours: number | null) {
  if (hours == null) {
    return '--';
  }

  const totalMinutes = Math.round(hours * 60);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function selectedRecordOrFallback(data: readonly WeekChartDatum[], selectedIndex: number) {
  return data[selectedIndex] ?? data[data.length - 1];
}

export function WeekChart({ records, settings, theme }: WeekChartProps) {
  const chartData = useMemo(() => buildWeekChartData(records, settings), [records, settings]);
  const domain = useMemo(() => calculateWeekChartDomain(records.slice(-7), settings), [records, settings]);
  const rules = useMemo(() => buildWeekChartRules(settings, domain), [domain, settings]);
  const stats = useMemo(() => buildWeekChartStats(records, settings), [records, settings]);
  const [bounds, setBounds] = useState<ChartBounds | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(chartData.length - 1);
  const { state } = useChartPressState({
    x: 0,
    y: {
      durationChartY: 0,
      sleepChartY: 0,
      wakeChartY: 0,
    },
  });

  useAnimatedReaction(
    () => state.matchedIndex.value,
    (nextIndex) => {
      runOnJS(setSelectedIndex)(Math.max(0, Math.min(chartData.length - 1, nextIndex)));
    },
    [chartData.length],
  );

  const activeData = chartData.filter((datum) => datum.record);
  const selected = selectedRecordOrFallback(chartData, selectedIndex);
  const targetSleepOffset = -rules[0].y;
  const targetWakeOffset = -rules[1].y;
  const chartWidth = bounds ? bounds.right - bounds.left : 0;
  const selectionLeft = bounds ? bounds.left + (chartWidth / Math.max(1, chartData.length - 1)) * selected.index : 0;

  if (activeData.length === 0) {
    return (
      <CardBackground theme={theme} style={styles.card}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: theme.accent }]}>▥</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Your sleep story starts tonight</Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Log your first night to see your weekly sleep window here.
          </Text>
        </View>
      </CardBackground>
    );
  }

  return (
    <CardBackground theme={theme} style={styles.card}>
      <View style={styles.statRow}>
        <StatPill color={theme.accent} label="avg sleep" value={formatAverageDuration(stats.averageDurationHours)} />
        <StatPill color="#7B68EE" label="sleep" value={`${stats.sleepConsistency}%`} />
        <StatPill color="#FFB347" label="wake" value={`${stats.wakeConsistency}%`} />
        <StatPill color={theme.success} label="accuracy" value={`${stats.accuracy}%`} />
      </View>
      <View style={styles.chartFrame}>
        <CartesianChart<WeekChartDatum, 'index', 'durationChartY' | 'sleepChartY' | 'wakeChartY'>
          chartPressState={state}
          data={chartData}
          domain={{ x: [-0.5, 6.5], y: [domain.bottom, domain.top] }}
          domainPadding={{ left: 20, right: 20, top: 8, bottom: 8 }}
          frame={{ lineColor: 'rgba(255,255,255,0.10)', lineWidth: 0 }}
          onChartBoundsChange={setBounds}
          padding={{ left: 44, right: 56, top: 16, bottom: 44 }}
          xAxis={{
            labelColor: 'transparent',
            lineColor: 'rgba(255,255,255,0.18)',
            lineWidth: 0,
            tickValues: chartData.map((datum) => datum.index),
          }}
          xKey="index"
          yAxis={[
            {
              axisSide: 'left',
              domain: [domain.bottom, domain.top],
              labelColor: 'transparent',
              lineColor: 'rgba(255,255,255,0.14)',
              lineWidth: 0,
              yKeys: ['durationChartY'],
            },
          ]}
          yKeys={['durationChartY', 'sleepChartY', 'wakeChartY']}>
          {({ chartBounds, points, xScale, yScale }) => (
            <Group>
              {rules.map((rule) => (
                <RuleLine chartBounds={chartBounds} color={rule.color} key={rule.label} y={yScale(rule.y)} />
              ))}
              {chartData.map((datum) => {
                if (datum.sleepChartY == null || datum.wakeChartY == null) {
                  return null;
                }

                const x = xScale(datum.index) - 12.5;
                const y = yScale(datum.sleepChartY);
                const height = yScale(datum.wakeChartY) - y;

                return (
                  <RoundedRect
                    color={rgba(theme.accent, 0.7)}
                    height={height}
                    key={datum.dateKey}
                    r={4}
                    width={25}
                    x={x}
                    y={y}
                  />
                );
              })}
              <Line color="rgba(180, 190, 200, 0.30)" curveType="catmullRom" points={points.durationChartY} strokeWidth={3} />
              {points.durationChartY.map((point) =>
                point.y == null ? null : <Circle color="rgba(180, 190, 200, 0.82)" cx={point.x} cy={point.y} key={point.xValue} r={4} />,
              )}
            </Group>
          )}
        </CartesianChart>
        <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
          {bounds ? (
            <SkiaLine color="rgba(255,255,255,0.30)" p1={vec(selectionLeft, bounds.top)} p2={vec(selectionLeft, bounds.bottom)} strokeWidth={2} />
          ) : null}
        </Canvas>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {bounds ? <AxisLabels bounds={bounds} domain={domain} rules={rules} theme={theme} /> : null}
          <XAxisLabels data={chartData} theme={theme} />
          {selected.record ? (
            <SelectionPopover
              selected={selected}
              targetSleepOffset={targetSleepOffset}
              targetWakeOffset={targetWakeOffset}
              theme={theme}
            />
          ) : null}
        </View>
      </View>
    </CardBackground>
  );
}

function RuleLine({ chartBounds, color, y }: { chartBounds: ChartBounds; color: string; y: number }) {
  return (
    <Group>
      <SkiaLine color={color} p1={vec(chartBounds.left, y)} p2={vec(chartBounds.right, y)} strokeWidth={2}>
        <DashPathEffect intervals={[4, 4]} />
      </SkiaLine>
    </Group>
  );
}

function StatPill({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function AxisLabels({
  bounds,
  domain,
  rules,
  theme,
}: {
  bounds: ChartBounds;
  domain: WeekChartDomain;
  rules: ReturnType<typeof buildWeekChartRules>;
  theme: AppTheme;
}) {
  const targetDurationHours = Number.parseFloat(rules[2].label);
  const targetSleepOffset = -rules[0].y;
  const targetWakeOffset = -rules[1].y;
  const durationLabels = [0, 4, 8, 12]
    .filter((value) => Math.abs(value - targetDurationHours) >= collisionThresholdHours)
    .map((value) => ({
      label: `${value}h`,
      y: yPosition(domain.bottom + (value / 12) * (domain.top - domain.bottom), bounds, domain),
    }));
  const firstOffset = Math.ceil(domain.minOffsetHours);
  const lastOffset = Math.floor(domain.maxOffsetHours);
  const timeLabels = Array.from({ length: Math.max(0, lastOffset - firstOffset + 1) }, (_, index) => firstOffset + index)
    .filter((value) => value % 4 === 0)
    .filter(
      (value) =>
        Math.abs(value - targetSleepOffset) >= collisionThresholdHours &&
        Math.abs(value - targetWakeOffset) >= collisionThresholdHours,
    )
    .map((value) => ({
      label: offsetHoursToClockLabel(value),
      y: yPosition(-value, bounds, domain),
    }));

  return (
    <>
      {durationLabels.map((label) => (
        <AxisLabel key={label.label} style={[styles.leftAxisLabel, { top: label.y - 9 }]}>
          {label.label}
        </AxisLabel>
      ))}
      {timeLabels.map((label) => (
        <AxisLabel color={theme.accent} key={label.label} style={[styles.rightAxisLabel, { top: label.y - 9 }]}>
          {label.label}
        </AxisLabel>
      ))}
      {rules.map((rule, index) => (
        <AxisLabel
          color={rule.color}
          key={rule.label}
          style={[index === 2 ? styles.leftRuleLabel : styles.rightRuleLabel, { top: yPosition(rule.y, bounds, domain) - 9 }]}>
          {rule.label}
        </AxisLabel>
      ))}
    </>
  );
}

function XAxisLabels({ data, theme }: { data: readonly WeekChartDatum[]; theme: AppTheme }) {
  return (
    <View style={styles.xAxisLabels}>
      {data.map((datum) => (
        <View key={datum.dateKey} style={styles.xAxisLabel}>
          <Text style={[styles.xAxisDay, { color: rgba(theme.textPrimary, 0.68) }]}>{datum.dayLabel}</Text>
          <Text style={[styles.xAxisDuration, { color: theme.textSecondary }]}>{datum.durationLabel}</Text>
        </View>
      ))}
    </View>
  );
}

function AxisLabel({
  children,
  color = 'rgba(255,255,255,0.56)',
  style,
}: {
  children: string;
  color?: string;
  style: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.axisLabel, { color }, style]}>{children}</Text>;
}

function SelectionPopover({
  selected,
  targetSleepOffset,
  targetWakeOffset,
  theme,
}: {
  selected: WeekChartDatum;
  targetSleepOffset: number;
  targetWakeOffset: number;
  theme: AppTheme;
}) {
  if (!selected.record) {
    return null;
  }

  const sleepDeviation = deviationMinutes(selected.record.bedtimeOffsetHours, targetSleepOffset);
  const wakeDeviation = deviationMinutes(selected.record.wakeOffsetHours, targetWakeOffset);

  return (
    <View style={[styles.selectionPopover, { borderColor: rgba(theme.textPrimary, 0.3), backgroundColor: rgba('#07111c', 0.88) }]}>
      <Text style={[styles.popoverDate, { color: theme.textPrimary }]}>{selected.dayLabel} · {selected.dateKey}</Text>
      <View style={[styles.popoverDivider, { backgroundColor: rgba(theme.textPrimary, 0.18) }]} />
      <Text style={[styles.popoverDuration, { color: theme.textPrimary }]}>{selected.durationLabel}</Text>
      <Text style={[styles.popoverLine, { color: deviationColor(sleepDeviation, theme) }]}>
        Bedtime {formatDeviation(sleepDeviation)}
      </Text>
      <Text style={[styles.popoverLine, { color: deviationColor(wakeDeviation, theme) }]}>
        Wake {formatDeviation(wakeDeviation)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  axisLabel: {
    fontSize: 12,
    fontWeight: '800',
    position: 'absolute',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 0,
  },
  chartFrame: {
    height: chartHeight,
    marginTop: Spacing.three,
    overflow: 'hidden',
  },
  emptyIcon: {
    fontSize: 46,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 300,
    justifyContent: 'center',
  },
  leftAxisLabel: {
    left: 0,
    width: 42,
  },
  leftRuleLabel: {
    left: 0,
    width: 42,
  },
  popoverDate: {
    fontSize: 11,
    fontWeight: '800',
  },
  popoverDivider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  popoverDuration: {
    fontSize: 13,
    fontWeight: '900',
  },
  popoverLine: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: Spacing.half,
  },
  rightAxisLabel: {
    right: 0,
    textAlign: 'right',
    width: 54,
  },
  rightRuleLabel: {
    right: 0,
    textAlign: 'right',
    width: 54,
  },
  selectionPopover: {
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 190,
    padding: 10,
    position: 'absolute',
    top: 92,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    flex: 1,
    padding: 10,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '900',
    marginTop: 4,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 24,
    textAlign: 'center',
  },
  xAxisDay: {
    fontSize: 12,
    fontWeight: '800',
  },
  xAxisDuration: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  xAxisLabel: {
    alignItems: 'center',
    flex: 1,
  },
  xAxisLabels: {
    bottom: 0,
    flexDirection: 'row',
    left: 48,
    position: 'absolute',
    right: 58,
  },
});
