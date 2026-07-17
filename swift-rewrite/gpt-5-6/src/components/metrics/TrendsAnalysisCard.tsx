// ports: twilight/components/common/sleepdurationtrendscard.swift

import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { StyleSheet, Text, View } from 'react-native';

import type { MetricsTrendPeriod } from '@/components/metrics/metrics-screen-model';
import { useTheme } from '@/theme/ThemeProvider';

export function TrendsAnalysisCard({
  lastDate,
  periods,
}: {
  lastDate: number | undefined;
  periods: readonly MetricsTrendPeriod[];
}) {
  const { theme } = useTheme();
  const sevenDay = periods.find((period) => period.days === 7);
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Trends Analysis</Text>
      {sevenDay ? (
        <Text style={[styles.insight, { color: theme.textSecondary }]}>
          Over the last 7 days, you&apos;re averaging {sevenDay.average} of sleep,
          {' '}{trendSentence(sevenDay.change)}
        </Text>
      ) : null}
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {lastDate ? `Last data point on ${formatDate(lastDate)}` : 'No data yet'}
      </Text>
      <View style={styles.header}>
        <HeaderText>Period</HeaderText>
        <HeaderText>Average</HeaderText>
        <HeaderText>Change</HeaderText>
        <HeaderText>Trend</HeaderText>
      </View>
      {periods.map((period, index) => (
        <View
          key={period.days}
          style={[styles.period, index > 0 && { borderTopColor: theme.textSecondary, borderTopWidth: StyleSheet.hairlineWidth }]}
        >
          <Text style={[styles.periodLabel, { color: theme.textSecondary }]}>{period.days}-day</Text>
          <Text style={[styles.periodValue, { color: theme.textPrimary }]}>{period.average}</Text>
          <View style={styles.change}>
            <View style={[styles.arrow, { backgroundColor: changeColor(period.change) }]}>
              <Text style={styles.arrowText}>{changeArrow(period.change)}</Text>
            </View>
            <Text style={[styles.changeText, { color: theme.textPrimary }]}>{period.change}</Text>
          </View>
          <Sparkline values={period.sparkline} />
        </View>
      ))}
    </View>
  );
}

function HeaderText({ children }: { children: string }) {
  const { theme } = useTheme();
  return <Text style={[styles.headerText, { color: theme.textSecondary }]}>{children}</Text>;
}

function Sparkline({ values }: { values: readonly number[] }) {
  const { theme } = useTheme();
  if (values.length < 2) {
    return <View style={[styles.sparklineFallback, { backgroundColor: theme.actionSecondary }]} />;
  }
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = Math.max(0.1, maximum - minimum);
  const path = Skia.Path.Make();
  values.forEach((value, index) => {
    const x = (index / (values.length - 1)) * 72;
    const y = 25 - ((value - minimum) / span) * 20;
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  return (
    <Canvas style={styles.sparkline}>
      <Path color={theme.actionSecondary} path={path} strokeWidth={2} style="stroke" />
    </Canvas>
  );
}

function trendSentence(change: string): string {
  if (change === '-') return 'with no earlier comparison yet.';
  if (change === '+0%' || change === '0%') return 'about the same as the previous week.';
  return change.startsWith('-')
    ? `down ${change.slice(1)} from the previous week.`
    : `up ${change.replace('+', '')} from the previous week.`;
}

function changeArrow(change: string): string {
  if (change === '-' || change === '+0%' || change === '0%') return '-';
  return change.startsWith('-') ? '↓' : '↑';
}

function changeColor(change: string): string {
  if (change === '-' || change === '+0%' || change === '0%') return '#8e8e93';
  return change.startsWith('-') ? '#ff9f0a' : '#0a84ff';
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}

const styles = StyleSheet.create({
  arrow: { alignItems: 'center', borderRadius: 13, height: 26, justifyContent: 'center', width: 26 },
  arrowText: { color: 'white', fontSize: 13, fontWeight: '800' },
  card: { borderRadius: 24, padding: 16 },
  change: { alignItems: 'center', flexDirection: 'row', gap: 5, width: 82 },
  changeText: { fontSize: 13, fontWeight: '700' },
  header: { flexDirection: 'row', marginTop: 14, paddingBottom: 4 },
  headerText: { fontSize: 11, width: '25%' },
  insight: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  period: { alignItems: 'center', flexDirection: 'row', minHeight: 50 },
  periodLabel: { fontSize: 13, width: '25%' },
  periodValue: { fontSize: 13, fontWeight: '600', width: '25%' },
  sparkline: { height: 30, width: 72 },
  sparklineFallback: { height: 2, width: 72 },
  subtitle: { fontSize: 12, marginTop: 6 },
  title: { fontSize: 15, fontWeight: '700' },
});
