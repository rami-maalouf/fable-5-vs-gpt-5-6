// ports: Components/Common/SectionTitle.swift, MultiStatCard.swift,
// ChartCard.swift and SleepMetricsView's MetricChip / SelectionSummaryRow /
// ChartSelectionBubble / empty state
import { BlurView } from 'expo-blur';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function SectionTitle({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
  );
}

export interface StatItem {
  title: string;
  valueText: string;
  icon: SymbolViewProps['name'];
  iconColor: string;
}

export function MultiStatCard({ stats }: { stats: StatItem[] }) {
  const theme = useTheme();
  const tint = theme.name === 'sunset' ? 'systemUltraThinMaterialLight' : 'systemUltraThinMaterialDark';
  return (
    <View style={styles.card}>
      <BlurView intensity={70} tint={tint} style={StyleSheet.absoluteFill} />
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.title} style={styles.gridItem}>
            <SymbolView name={stat.icon} size={20} weight="semibold" tintColor={stat.iconColor} />
            <View style={styles.statTexts}>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{stat.title}</Text>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {stat.valueText}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const tint = theme.name === 'sunset' ? 'systemUltraThinMaterialLight' : 'systemUltraThinMaterialDark';
  return (
    <View style={styles.card}>
      <BlurView intensity={70} tint={tint} style={StyleSheet.absoluteFill} />
      <View style={styles.chartCardContent}>
        <View style={styles.chartCardHeader}>
          <Text style={[styles.chartCardTitle, { color: theme.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.chartCardSubtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.chartCardBody}>{children}</View>
      </View>
    </View>
  );
}

export function MetricChip({ title, value }: { title: string; value: string }) {
  const theme = useTheme();
  const bg = theme.name === 'sunset' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(28, 28, 30, 0.6)';
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipTitle, { color: theme.textSecondary }]}>{title}</Text>
      <Text style={[styles.chipValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

export function SelectionSummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

export function SelectionBubble({ title, lines }: { title: string; lines: string[] }) {
  const theme = useTheme();
  const bg = theme.name === 'sunset' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(44, 44, 46, 0.92)';
  return (
    <View style={[styles.bubble, { backgroundColor: bg }]}>
      <Text style={[styles.bubbleTitle, { color: theme.textPrimary }]}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={[styles.bubbleLine, { color: theme.textPrimary }]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

export function MetricsEmptyState() {
  const theme = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.empty}>
        <SymbolView
          name="chart.line.uptrend.xyaxis.circle.fill"
          size={44}
          tintColor={theme.actionPrimary}
        />
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
          Not enough nights for metrics yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Track a few nights and this tab will unlock trends, streaks, and long-range insights.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 17, fontWeight: '500', paddingBottom: 0 },
  card: { borderRadius: 24, overflow: 'hidden' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    rowGap: 12,
  },
  gridItem: {
    width: '50%',
    flexDirection: 'row',
    gap: 12,
    paddingRight: 12,
  },
  statTexts: { flex: 1, gap: 4 },
  statTitle: { fontSize: 12 },
  statValue: { fontSize: 20, fontWeight: '600' },
  chartCardContent: { padding: 16, gap: 12 },
  chartCardHeader: { gap: 4 },
  chartCardTitle: { fontSize: 15, fontWeight: '600' },
  chartCardSubtitle: { fontSize: 12 },
  chartCardBody: { minHeight: 160 },
  chip: {
    flex: 1,
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  chipTitle: { fontSize: 12 },
  chipValue: { fontSize: 17, fontWeight: '600' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 12, fontWeight: '600' },
  bubble: {
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 3,
    alignSelf: 'flex-start',
  },
  bubbleTitle: { fontSize: 11, fontWeight: '600' },
  bubbleLine: { fontSize: 11 },
  empty: { alignItems: 'center', gap: 14, paddingVertical: 32, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySubtitle: { fontSize: 15, textAlign: 'center' },
});
