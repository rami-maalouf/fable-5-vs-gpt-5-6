import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export type DashboardViewMode = 'week' | 'average' | 'score' | 'core';

const modes: readonly { label: string; value: DashboardViewMode }[] = [
  { label: 'Week', value: 'week' },
  { label: '7-Night Avg', value: 'average' },
  { label: 'Score', value: 'score' },
  { label: 'Core', value: 'core' },
];

export function SegmentedPicker({
  onChange,
  value,
}: {
  onChange(value: DashboardViewMode): void;
  value: DashboardViewMode;
}) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel="Dashboard view"
      accessibilityRole="tablist"
      style={[styles.container, { backgroundColor: theme.actionSecondary }]}
    >
      {modes.map((mode) => {
        const selected = value === mode.value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={mode.value}
            onPress={() => onChange(mode.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: theme.textSecondary },
              pressed && styles.pressed,
            ]}
            testID={`dashboard-mode-${mode.value}`}
          >
            <Text style={[styles.label, { color: selected ? theme.backgroundGradient[0] : theme.textPrimary }]}>
              {mode.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 18, flexDirection: 'row', padding: 3 },
  label: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.72 },
  segment: { alignItems: 'center', borderRadius: 15, flex: 1, minHeight: 40, justifyContent: 'center' },
});
