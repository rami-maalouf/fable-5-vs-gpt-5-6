import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line as SkiaLine,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { CartesianChart, Line, type ChartBounds, useChartPressState } from 'victory-native';

import { CardBackground } from '@/components/common';
import { Spacing } from '@/constants/theme';
import { themes } from '@/theme';

import {
  formatRightAxisClock,
  weekChartSpikeData,
  weekChartSpikeRules,
  type WeekChartSpikeDatum,
} from './week-chart-spike-data';

const chartHeight = 300;
const plotDomain = { x: [-0.5, 6.5] as [number, number], y: [0, 12] as [number, number] };

type ChartDatum = WeekChartSpikeDatum & {
  index: number;
};

const chartData = weekChartSpikeData.map((datum, index) => ({ ...datum, index }));

export function DashboardWeekChartSpike() {
  const theme = themes.twilight;
  const { state } = useChartPressState({
    x: 0,
    y: {
      bedtimeChartHour: 0,
      durationHours: 0,
      wakeChartHour: 0,
    },
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [bounds, setBounds] = useState<ChartBounds | null>(null);

  useAnimatedReaction(
    () => state.matchedIndex.value,
    (nextIndex) => {
      runOnJS(setSelectedIndex)(Math.max(0, Math.min(chartData.length - 1, nextIndex)));
    },
    [],
  );

  const selected = chartData[selectedIndex];
  const chartWidth = bounds ? bounds.right - bounds.left : 0;
  const selectionLeft = bounds ? bounds.left + (chartWidth / 6) * selectedIndex : 0;

  return (
    <CardBackground theme={theme} style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>spike</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>dashboard week chart</Text>
        </View>
        <Text style={[styles.decisionPill, { color: theme.accent }]}>victory + skia</Text>
      </View>
      <View style={styles.statRow}>
        <StatPill label="avg sleep" value="7h 1m" color={theme.accent} />
        <StatPill label="sleep" value="74%" color="#7b7cff" />
        <StatPill label="wake" value="82%" color="#ff9f2f" />
        <StatPill label="accuracy" value="33%" color={theme.success} />
      </View>
      <View style={styles.chartFrame}>
        <CartesianChart<ChartDatum, 'index', 'durationHours' | 'bedtimeChartHour' | 'wakeChartHour'>
          chartPressState={state}
          data={chartData}
          domain={plotDomain}
          domainPadding={{ left: 20, right: 20, top: 8, bottom: 8 }}
          frame={{ lineColor: 'rgba(255,255,255,0.10)', lineWidth: 0 }}
          onChartBoundsChange={setBounds}
          padding={{ left: 44, right: 56, top: 16, bottom: 44 }}
          xKey="index"
          yKeys={['durationHours', 'bedtimeChartHour', 'wakeChartHour']}
          xAxis={{
            tickValues: chartData.map((datum) => datum.index),
            lineColor: 'rgba(255,255,255,0.18)',
            lineWidth: 0,
            labelColor: 'transparent',
          }}
          yAxis={[
            {
              yKeys: ['durationHours'],
              axisSide: 'left',
              domain: plotDomain.y,
              tickValues: [0, 4, 7, 8, 12],
              lineColor: 'rgba(255,255,255,0.14)',
              lineWidth: 0,
              labelColor: 'transparent',
            },
          ]}>
          {({ chartBounds, points, xScale, yScale }) => (
            <Group>
              <RuleLine
                chartBounds={chartBounds}
                color="#7b7cff"
                y={yScale(weekChartSpikeRules.bedtime.chartHour)}
              />
              <RuleLine
                chartBounds={chartBounds}
                color="#ff9f2f"
                y={yScale(weekChartSpikeRules.wake.chartHour)}
              />
              <RuleLine
                chartBounds={chartBounds}
                color="rgba(255,255,255,0.55)"
                y={yScale(weekChartSpikeRules.goal.chartHour)}
              />
              {chartData.map((datum) => {
                const x = xScale(datum.index) - 12.5;
                const y = yScale(datum.bedtimeChartHour);
                const height = yScale(datum.wakeChartHour) - y;

                return (
                  <RoundedRect
                    color="rgba(0, 212, 255, 0.72)"
                    height={height}
                    key={datum.day}
                    r={4}
                    width={25}
                    x={x}
                    y={y}
                  />
                );
              })}
              <Line
                color="rgba(180, 190, 200, 0.45)"
                curveType="catmullRom"
                points={points.durationHours}
                strokeWidth={3}
              />
              {points.durationHours.map((point) => (
                <Circle color="#28c6df" cx={point.x} cy={point.y ?? 0} key={point.xValue} r={5} />
              ))}
            </Group>
          )}
        </CartesianChart>
        <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
          {bounds ? (
            <SkiaLine
              color="rgba(255,255,255,0.48)"
              p1={vec(selectionLeft, bounds.top)}
              p2={vec(selectionLeft, bounds.bottom)}
              strokeWidth={1}>
              <DashPathEffect intervals={[4, 6]} />
            </SkiaLine>
          ) : null}
        </Canvas>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <YAxisLabels />
          <RightAxisLabels />
          <XAxisLabels />
        </View>
      </View>
      <View style={styles.selectionFooter}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>selected</Text>
        <Text style={[styles.footerValue, { color: theme.textPrimary }]}>
          {selected.day} · {selected.durationLabel} · bed {formatRightAxisClock(selected.bedtimeChartHour)} · wake{' '}
          {formatRightAxisClock(selected.wakeChartHour)}
        </Text>
      </View>
    </CardBackground>
  );
}

function RuleLine({
  chartBounds,
  color,
  y,
}: {
  chartBounds: ChartBounds;
  color: string;
  y: number;
}) {
  return (
    <Group>
      <SkiaLine color={color} p1={vec(chartBounds.left, y)} p2={vec(chartBounds.right, y)} strokeWidth={2}>
        <DashPathEffect intervals={[8, 8]} />
      </SkiaLine>
      <Circle color={color} cx={chartBounds.right} cy={y} r={2.5} />
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

function YAxisLabels() {
  return (
    <>
      <AxisLabel style={[styles.leftAxisLabel, { top: 11 }]}>12h</AxisLabel>
      <AxisLabel style={[styles.leftAxisLabel, { top: 116 }]}>8h</AxisLabel>
      <AxisLabel style={[styles.leftAxisLabel, { top: 162 }]}>7.0h</AxisLabel>
      <AxisLabel style={[styles.leftAxisLabel, { top: 205 }]}>4h</AxisLabel>
      <AxisLabel style={[styles.leftAxisLabel, { top: 247 }]}>0h</AxisLabel>
    </>
  );
}

function RightAxisLabels() {
  return (
    <>
      <AxisLabel color="#00d4ff" style={[styles.rightAxisLabel, { top: 72 }]}>
        2 AM
      </AxisLabel>
      <AxisLabel color="#00d4ff" style={[styles.rightAxisLabel, { top: 166 }]}>
        6 AM
      </AxisLabel>
      <AxisLabel color="#ff9f2f" style={[styles.rightAxisLabel, { top: 203 }]}>
        7:30 AM
      </AxisLabel>
      <AxisLabel color="#00d4ff" style={[styles.rightAxisLabel, { top: 241 }]}>
        10 AM
      </AxisLabel>
    </>
  );
}

function XAxisLabels() {
  return (
    <View style={styles.xAxisLabels}>
      {chartData.map((datum) => (
        <View key={datum.day} style={styles.xAxisLabel}>
          <Text style={styles.xAxisDay}>{datum.day}</Text>
          <Text style={styles.xAxisDuration}>{datum.durationLabel}</Text>
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

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.two,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  decisionPill: {
    backgroundColor: 'rgba(0, 212, 255, 0.10)',
    borderColor: 'rgba(0, 212, 255, 0.30)',
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    flex: 1,
    padding: 10,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  chartFrame: {
    height: chartHeight,
    overflow: 'hidden',
  },
  axisLabel: {
    fontSize: 15,
    fontWeight: '800',
    position: 'absolute',
  },
  leftAxisLabel: {
    left: 0,
    width: 42,
  },
  rightAxisLabel: {
    right: 0,
    textAlign: 'right',
    width: 54,
  },
  xAxisLabels: {
    bottom: 0,
    flexDirection: 'row',
    left: 48,
    position: 'absolute',
    right: 58,
  },
  xAxisLabel: {
    alignItems: 'center',
    flex: 1,
  },
  xAxisDay: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
    fontWeight: '800',
  },
  xAxisDuration: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  selectionFooter: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
});
