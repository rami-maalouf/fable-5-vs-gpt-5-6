import {
  Circle,
  DashPathEffect,
  Group,
  Line as SkiaLine,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartesianChart, Line, useChartPressState, type ChartBounds } from 'victory-native';

import { GlassCard } from '@/components/common/glass-card';
import { ScreenBackground } from '@/components/common/screen-background';
import { useTheme } from '@/theme/ThemeProvider';

import {
  formatChartClock,
  weekChartData,
  weekChartRules,
  type WeekChartDatum,
} from './week-chart-data';

const chartHeight = 300;
const chartDomain = { x: [-0.5, 6.5] as [number, number], y: [0, 12] as [number, number] };

interface ChartDatum extends WeekChartDatum, Record<string, unknown> {
  index: number;
}

const chartData: ChartDatum[] = weekChartData.map((datum, index) => ({ ...datum, index }));

export default function DashboardWeekChartSpike() {
  const { theme } = useTheme();
  const { isActive, state } = useChartPressState({
    x: 3,
    y: { bedtimeChartHour: 0, durationHours: 0, wakeChartHour: 0 },
  });
  const [selectedIndex, setSelectedIndex] = useState(3);

  useAnimatedReaction(
    () => state.matchedIndex.value,
    (nextIndex, previousIndex) => {
      if (nextIndex >= 0 && nextIndex !== previousIndex) {
        runOnJS(setSelectedIndex)(Math.min(chartData.length - 1, nextIndex));
      }
    },
    [],
  );

  const selected = chartData[selectedIndex];

  return (
    <ScreenBackground>
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>CHART SPIKE</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Dashboard week chart</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Drag across the chart to scrub</Text>
          </View>

          <GlassCard style={styles.card}>
            <View style={styles.statRow}>
              <StatPill color={theme.accent} label="AVG SLEEP" value="7h 1m" />
              <StatPill color="#7b7cff" label="SLEEP CONS." value="74%" />
              <StatPill color="#ff9f2f" label="WAKE CONS." value="82%" />
              <StatPill color={theme.success} label="ACCURACY" value="33%" />
            </View>

            <View style={styles.chartFrame}>
              <CartesianChart<
                ChartDatum,
                'index',
                'durationHours' | 'bedtimeChartHour' | 'wakeChartHour'
              >
                chartPressConfig={{ pan: { activateAfterLongPress: 0 } }}
                chartPressState={state}
                data={chartData}
                domain={chartDomain}
                domainPadding={{ bottom: 8, left: 18, right: 18, top: 8 }}
                frame={{ lineColor: 'transparent', lineWidth: 0 }}
                padding={{ bottom: 46, left: 45, right: 55, top: 18 }}
                xAxis={{ labelColor: 'transparent', lineColor: 'transparent', tickValues: chartData.map(({ index }) => index) }}
                xKey="index"
                yAxis={[
                  {
                    domain: chartDomain.y,
                    labelColor: 'transparent',
                    lineColor: 'transparent',
                    tickValues: [0, 4, 7, 8, 12],
                    yKeys: ['durationHours'],
                  },
                ]}
                yKeys={['durationHours', 'bedtimeChartHour', 'wakeChartHour']}
              >
                {({ chartBounds, points, xScale, yScale }) => (
                  <Group>
                    <GridLine chartBounds={chartBounds} y={yScale(2)} />
                    <GridLine chartBounds={chartBounds} y={yScale(6)} />
                    <GridLine chartBounds={chartBounds} y={yScale(10)} />
                    <RuleLine chartBounds={chartBounds} color="#7b7cff" y={yScale(weekChartRules.bedtime.chartHour)} />
                    <RuleLine chartBounds={chartBounds} color="rgba(210,216,222,0.65)" y={yScale(weekChartRules.duration.chartHour)} />
                    <RuleLine chartBounds={chartBounds} color="#ff9f2f" y={yScale(weekChartRules.wake.chartHour)} />

                    {chartData.map((datum) => {
                      const barTop = yScale(datum.bedtimeChartHour);
                      const barBottom = yScale(datum.wakeChartHour);
                      return (
                        <RoundedRect
                          color="rgba(0,212,255,0.70)"
                          height={barBottom - barTop}
                          key={datum.day}
                          r={4}
                          width={25}
                          x={xScale(datum.index) - 12.5}
                          y={barTop}
                        />
                      );
                    })}

                    <Line
                      color="rgba(180,190,200,0.38)"
                      curveType="catmullRom"
                      points={points.durationHours}
                      strokeWidth={3}
                    />
                    {points.durationHours.map((point) => (
                      <Circle
                        color="rgba(180,190,200,0.72)"
                        cx={point.x}
                        cy={point.y ?? chartBounds.bottom}
                        key={String(point.xValue)}
                        r={4.5}
                      />
                    ))}
                    <SkiaLine
                      color="rgba(255,255,255,0.34)"
                      p1={vec(xScale(selected.index), chartBounds.top)}
                      p2={vec(xScale(selected.index), chartBounds.bottom)}
                      strokeWidth={2}
                    />
                  </Group>
                )}
              </CartesianChart>

              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <AxisLabels />
                <XAxisLabels />
              </View>
            </View>

            <View style={[styles.selection, isActive && styles.selectionActive]}>
              <Text style={[styles.selectionDay, { color: theme.textPrimary }]}>{selected.day}</Text>
              <Text style={[styles.selectionValue, { color: theme.accent }]}>{selected.durationLabel}</Text>
              <Text style={[styles.selectionDetail, { color: theme.textSecondary }]}>
                Bed {formatChartClock(selected.bedtimeChartHour)} · Wake {formatChartClock(selected.wakeChartHour)}
              </Text>
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function StatPill({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text numberOfLines={1} style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function GridLine({ chartBounds, y }: { chartBounds: ChartBounds; y: number }) {
  return (
    <SkiaLine
      color="rgba(255,255,255,0.16)"
      p1={vec(chartBounds.left, y)}
      p2={vec(chartBounds.right, y)}
      strokeWidth={1}
    />
  );
}

function RuleLine({ chartBounds, color, y }: { chartBounds: ChartBounds; color: string; y: number }) {
  return (
    <SkiaLine color={color} p1={vec(chartBounds.left, y)} p2={vec(chartBounds.right, y)} strokeWidth={2}>
      <DashPathEffect intervals={[4, 4]} />
    </SkiaLine>
  );
}

function AxisLabels() {
  return (
    <>
      <Text style={[styles.axisLabel, styles.leftAxis, { top: 10 }]}>12h</Text>
      <Text style={[styles.axisLabel, styles.leftAxis, { top: 91 }]}>8h</Text>
      <Text style={[styles.axisLabel, styles.leftAxis, { top: 112 }]}>7.0h</Text>
      <Text style={[styles.axisLabel, styles.leftAxis, { top: 172 }]}>4h</Text>
      <Text style={[styles.axisLabel, styles.leftAxis, { top: 251 }]}>0h</Text>

      <Text style={[styles.axisLabel, styles.rightAxis, styles.ruleLabel, styles.bedtimeRule, { top: 10 }]}>12:30 AM</Text>
      <Text style={[styles.axisLabel, styles.rightAxis, { top: 49 }]}>2 AM</Text>
      <Text style={[styles.axisLabel, styles.rightAxis, { top: 131 }]}>6 AM</Text>
      <Text style={[styles.axisLabel, styles.rightAxis, styles.ruleLabel, styles.wakeRule, { top: 160 }]}>7:30 AM</Text>
      <Text style={[styles.axisLabel, styles.rightAxis, { top: 212 }]}>10 AM</Text>
    </>
  );
}

function XAxisLabels() {
  return (
    <View style={styles.xLabels}>
      {chartData.map((datum) => (
        <View key={datum.day} style={styles.xLabel}>
          <Text style={styles.xDay}>{datum.day}</Text>
          <Text style={styles.xDuration}>{datum.durationLabel}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  axisLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    fontWeight: '800',
    position: 'absolute',
  },
  bedtimeRule: { color: '#7b7cff' },
  card: { marginHorizontal: 12 },
  chartFrame: { height: chartHeight, overflow: 'hidden' },
  content: { paddingBottom: 28 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  header: { paddingBottom: 14, paddingHorizontal: 18, paddingTop: 14 },
  leftAxis: { left: 0, width: 42 },
  rightAxis: { color: '#00d4ff', right: 0, textAlign: 'right', width: 53 },
  ruleLabel: { fontSize: 9 },
  safeArea: { flex: 1 },
  selection: {
    alignItems: 'baseline',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectionActive: { borderColor: 'rgba(255,255,255,0.35)' },
  selectionDay: { fontSize: 15, fontWeight: '800' },
  selectionDetail: { flex: 1, fontSize: 11, textAlign: 'right' },
  selectionValue: { fontSize: 14, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.50)', fontSize: 8, fontWeight: '800' },
  statPill: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, flex: 1, padding: 8 },
  statRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 3 },
  subtitle: { fontSize: 13, marginTop: 3 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 3 },
  wakeRule: { color: '#ff9f2f' },
  xDay: { color: 'rgba(255,255,255,0.62)', fontSize: 11, fontWeight: '800' },
  xDuration: { color: 'rgba(255,255,255,0.48)', fontSize: 9, fontWeight: '700', marginTop: 2 },
  xLabel: { alignItems: 'center', flex: 1 },
  xLabels: { bottom: 0, flexDirection: 'row', left: 45, position: 'absolute', right: 55 },
});
