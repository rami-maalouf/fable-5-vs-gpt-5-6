// ports: Components/Common/SleepDurationTrendsCard.swift
// 3/7/14/30/90-day rows with average, change chip and a mini sparkline
import { BlurView } from 'expo-blur';
import { Canvas, Path } from '@shopify/react-native-skia';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import type { TrendPeriod } from '@/domain/metrics/analyzer';
import type { CalendarDay } from '@/domain/models';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';
import { catmullRomPath } from '@/components/charts/path-utils';
import { formatAbbrevDate } from '@/components/charts/date-scale';

const SPARK_W = 80;
const SPARK_H = 24;

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return <View style={{ width: SPARK_W, height: SPARK_H }} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * (SPARK_W - 4) + 2,
    y: 2 + (1 - (v - min) / range) * (SPARK_H - 4),
  }));
  return (
    <Canvas style={{ width: SPARK_W, height: SPARK_H }}>
      <Path path={catmullRomPath(points)} style="stroke" strokeWidth={1.6} color={color} />
    </Canvas>
  );
}

function fmtHm(hours: number | null): string {
  if (hours == null) return '-';
  const totalMinutes = Math.round(hours * 60);
  return `${Math.trunc(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

export function TrendsCard({
  periods,
  lastDate,
}: {
  periods: TrendPeriod[];
  lastDate: CalendarDay | null;
}) {
  const theme = useTheme();
  const fixed = useFixedColor();
  const tint = theme.name === 'sunset' ? 'systemUltraThinMaterialLight' : 'systemUltraThinMaterialDark';

  const sevenDay = periods.find((p) => p.days === 7);
  let insight: string | null = null;
  if (sevenDay?.averageDuration != null) {
    insight = `Over the last 7 days, you're averaging ${fmtHm(sevenDay.averageDuration)} of sleep`;
    if (sevenDay.changePercent != null) {
      const rounded = Math.round(sevenDay.changePercent);
      insight +=
        rounded === 0
          ? ', about the same as the previous week.'
          : rounded > 0
            ? `, up ${rounded}% from the previous week.`
            : `, down ${Math.abs(rounded)}% from the previous week.`;
    } else {
      insight += '.';
    }
  }

  const changeMeta = (pct: number | null) => {
    if (pct == null) return { text: '—', icon: 'minus' as const, color: theme.textSecondary };
    const rounded = Math.round(pct);
    const text = rounded >= 0 ? `+${rounded}%` : `${rounded}%`;
    if (pct >= 0.5) return { text, icon: 'arrow.up' as const, color: fixed('#0a84ff') };
    if (pct <= -0.5) return { text, icon: 'arrow.down' as const, color: fixed('#ff9500') };
    return { text, icon: 'minus' as const, color: theme.textSecondary };
  };

  return (
    <View style={styles.card}>
      <BlurView intensity={70} tint={tint} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Trends Analysis</Text>
        {insight && <Text style={[styles.insight, { color: theme.textSecondary }]}>{insight}</Text>}
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {lastDate ? `Last data point on ${formatAbbrevDate(lastDate)}` : 'No data yet'}
        </Text>

        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.periodCol, { color: theme.textSecondary }]}>Period</Text>
          <Text style={[styles.headerCell, styles.avgCol, { color: theme.textSecondary }]}>Average</Text>
          <View style={styles.flexSpacer} />
          <Text style={[styles.headerCell, styles.changeCol, { color: theme.textSecondary }]}>Change</Text>
          <Text style={[styles.headerCell, styles.trendCol, { color: theme.textSecondary }]}>Trend</Text>
        </View>

        {periods.map((period, index) => {
          const change = changeMeta(period.changePercent);
          return (
            <View key={period.days}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <Text style={[styles.periodCol, styles.periodText, { color: theme.textPrimary }]}>
                  {period.days}d
                </Text>
                <Text style={[styles.avgCol, styles.avgText, { color: theme.textPrimary }]}>
                  {fmtHm(period.averageDuration)}
                </Text>
                <View style={styles.flexSpacer} />
                <View style={[styles.changeCol, styles.changeRow]}>
                  <SymbolView name={change.icon} size={10} weight="semibold" tintColor={change.color} />
                  <Text style={[styles.changeText, { color: change.color }]}>{change.text}</Text>
                </View>
                <View style={styles.trendCol}>
                  <Sparkline values={period.sparkline} color={theme.actionPrimary} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden' },
  content: { padding: 16, gap: 6 },
  title: { fontSize: 15, fontWeight: '600' },
  insight: { fontSize: 15 },
  subtitle: { fontSize: 12, paddingTop: 2, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8 },
  headerCell: { fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(84, 84, 88, 0.6)' },
  periodCol: { width: 50 },
  avgCol: { width: 76 },
  changeCol: { width: 70 },
  trendCol: { width: SPARK_W, alignItems: 'flex-end' },
  flexSpacer: { flex: 1 },
  periodText: { fontSize: 15, fontWeight: '600' },
  avgText: { fontSize: 14 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  changeText: { fontSize: 13, fontWeight: '600' },
});
