// ports: twilight/components/common/chartcard.swift

import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export const METRICS_CHART_HEIGHT = 220;
export const METRICS_CHART_PADDING = { bottom: 28, left: 38, right: 8, top: 12 } as const;

export function MetricsChartCard({
  children,
  subtitle,
  title,
}: PropsWithChildren<{ subtitle: string; title: string }>) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      <View style={styles.chart}>{children}</View>
    </View>
  );
}

export function MetricsChartAxes({
  data,
  domain,
  formatY,
  ticks,
}: {
  data: readonly { date: number; dayKey: string }[];
  domain: [number, number];
  formatY(value: number): string;
  ticks: readonly number[];
}) {
  const { theme } = useTheme();
  const labels = sampleDateLabels(data);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ticks.map((tick) => (
        <Text key={tick} style={[styles.axisLabel, { color: theme.textSecondary, top: axisTop(tick, domain) }]}>
          {formatY(tick)}
        </Text>
      ))}
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
    </View>
  );
}

export function ChartSelectionBubble({
  accent,
  date,
  lines,
}: {
  accent: string;
  date: number;
  lines: ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View pointerEvents="none" style={[styles.selection, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.selectionDate, { color: theme.textSecondary }]}>{formatShortDate(date)}</Text>
      <View style={styles.selectionLines}>
        <View style={[styles.selectionDot, { backgroundColor: accent }]} />
        {lines}
      </View>
    </View>
  );
}

export function formatShortDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'short' }).format(timestamp);
}

function sampleDateLabels<T extends { date: number; dayKey: string }>(data: readonly T[]): T[] {
  if (data.length <= 3) return [...data];
  return [data[0], data[Math.round((data.length - 1) / 2)], data[data.length - 1]];
}

function dateLabelPosition(
  date: number,
  data: readonly { date: number }[],
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
  const height = METRICS_CHART_HEIGHT - METRICS_CHART_PADDING.top - METRICS_CHART_PADDING.bottom;
  return METRICS_CHART_PADDING.top + ((domain[1] - value) / (domain[1] - domain[0])) * height - 7;
}

const styles = StyleSheet.create({
  axisLabel: { fontSize: 10, fontWeight: '700', left: 0, position: 'absolute' },
  card: { borderColor: 'rgba(142,142,147,0.3)', borderRadius: 24, borderWidth: 1, padding: 16 },
  chart: { marginTop: 12 },
  dateLabel: { fontSize: 9, fontWeight: '600', position: 'absolute', textAlign: 'center', width: 44 },
  dateLabels: { bottom: 0, height: 14, left: METRICS_CHART_PADDING.left, position: 'absolute', right: METRICS_CHART_PADDING.right },
  selection: { borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 6, position: 'absolute', right: 10, top: 8 },
  selectionDate: { fontSize: 9, fontWeight: '700' },
  selectionDot: { borderRadius: 3, height: 6, width: 6 },
  selectionLines: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 2 },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  title: { fontSize: 16, fontWeight: '800' },
});
