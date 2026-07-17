// ports: twilight/components/common/metricchip.swift

import { StyleSheet, Text, View } from 'react-native';

import type { MetricsChipPair } from '@/components/metrics/metrics-screen-model';
import { useTheme } from '@/theme/ThemeProvider';

export function MetricChipRow({ pair }: { pair: MetricsChipPair }) {
  return (
    <View style={styles.row}>
      <MetricChip label={pair.left.label} value={pair.left.value} />
      <MetricChip label={pair.right.label} value={pair.right.value} />
    </View>
  );
}

export function MetricChip({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel={`${label}, ${value}`}
      style={[styles.chip, { backgroundColor: theme.cardBackground }]}
    >
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 14, flex: 1, gap: 5, minHeight: 68, padding: 12 },
  label: { fontSize: 12, lineHeight: 16 },
  row: { flexDirection: 'row', gap: 8 },
  value: { fontSize: 17, fontWeight: '700', lineHeight: 22 },
});
