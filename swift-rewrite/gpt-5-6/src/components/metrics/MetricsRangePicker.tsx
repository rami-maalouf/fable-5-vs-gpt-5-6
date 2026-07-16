// ports: twilight/views/sleepmetricsview.swift

import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  METRICS_RANGES,
  type MetricsRange,
} from '@/components/metrics/metrics-screen-model';
import { useTheme } from '@/theme/ThemeProvider';

export function MetricsRangePicker({
  onChange,
  value,
}: {
  onChange(range: MetricsRange): void;
  value: MetricsRange;
}) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel="Metrics range"
      accessibilityRole="tablist"
      style={[styles.container, { backgroundColor: theme.actionSecondary }]}
    >
      {METRICS_RANGES.map((range) => {
        const selected = range === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={range}
            onPress={() => onChange(range)}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: theme.textSecondary },
              pressed && styles.pressed,
            ]}
            testID={`metrics-range-${range.toLowerCase()}`}
          >
            <Text style={[styles.label, { color: selected ? theme.backgroundGradient[0] : theme.textPrimary }]}>
              {range}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, flexDirection: 'row', padding: 3 },
  label: { fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.72 },
  segment: { alignItems: 'center', borderRadius: 10, flex: 1, minHeight: 34, justifyContent: 'center' },
});
