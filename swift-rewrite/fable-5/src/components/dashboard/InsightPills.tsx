// ports: Views/SleepChartView.swift (SleepChartInsightPill row)
// 4 pills above the week chart: title 10 bold uppercased secondary, value 15
// semibold tinted, subtitle caption2
import { StyleSheet, Text, View } from 'react-native';

export interface InsightItem {
  title: string;
  value: string;
  subtitle: string;
  tint: string;
}

export function InsightPills({ items }: { items: InsightItem[] }) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.title} style={styles.pill}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {item.title.toUpperCase()}
          </Text>
          <Text
            style={[styles.value, { color: item.tint }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}>
            {item.value}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {item.subtitle}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 28, 30, 0.55)',
  },
  title: { fontSize: 10, fontWeight: '700', color: '#98989f' },
  value: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 11, color: '#98989f' },
});
