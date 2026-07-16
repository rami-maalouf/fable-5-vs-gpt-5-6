import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export interface InsightPillModel {
  color: string;
  subtitle: string;
  title: string;
  value: string;
}

export function InsightPills({ items }: { items: readonly InsightPillModel[] }) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.title} style={[styles.pill, { backgroundColor: theme.cardBackground }]}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.textSecondary }]}>{item.title}</Text>
          <Text numberOfLines={1} style={[styles.value, { color: item.color }]}>{item.value}</Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: 15, flex: 1, minWidth: 0, paddingHorizontal: 6, paddingVertical: 11 },
  row: { flexDirection: 'row', gap: 6 },
  subtitle: { fontSize: 9, marginTop: 4 },
  title: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.15 },
  value: { fontSize: 18, fontVariant: ['tabular-nums'], fontWeight: '800', marginTop: 6 },
});
