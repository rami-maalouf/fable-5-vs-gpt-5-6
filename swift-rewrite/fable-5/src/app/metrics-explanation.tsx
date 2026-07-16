// ports: Views/Components/Dashboard/MetricsExplanationView.swift
// "Analytics Guide" sheet (detents 0.6/large with drag indicator)
import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { useTheme } from '@/theme/ThemeProvider';

const ITEMS: { icon: SymbolViewProps['name']; title: string; definition: string; calculation: string }[] = [
  {
    icon: 'clock.fill',
    title: 'Average Sleep',
    definition: 'The average duration of your sleep sessions over the selected period.',
    calculation: 'Total sleep hours ÷ Number of tracked nights',
  },
  {
    icon: 'bed.double.fill',
    title: 'Sleep Consistency',
    definition: 'How consistent your bedtime is relative to your average bedtime.',
    calculation:
      'We calculate the standard deviation of your bedtimes. You lose 40 points for every hour of deviation from your average.',
  },
  {
    icon: 'sun.max.fill',
    title: 'Wake Consistency',
    definition: 'How consistent your wake-up time is relative to your average wake-up time.',
    calculation:
      'Similar to sleep consistency, we look at the deviation of your wake times. 40 points deducted per hour of deviation.',
  },
  {
    icon: 'target',
    title: 'Accuracy',
    definition: 'How closely you are adhering to your set Goal Times.',
    calculation:
      'We measure the difference between your actual times and your goal times. You lose 30 points for every hour of difference (averaged between sleep and wake).',
  },
];

export default function MetricsExplanationScreen() {
  const theme = useTheme();
  return (
    <Screen starCount={20}>
      <View style={styles.navOverlay} pointerEvents="box-none">
        <Text style={[styles.navTitle, { color: theme.textPrimary }]}>Analytics Guide</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.doneButton}>
          <Text style={[styles.done, { color: theme.actionPrimary }]}>Done</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Understanding Your Data</Text>
        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          We believe in transparency. Here&apos;s exactly how we calculate your sleep metrics so
          you know what you&apos;re tracking.
        </Text>
        <View style={styles.divider} />
        {ITEMS.map((item) => (
          <View key={item.title} style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.actionPrimary}1a` }]}>
                <SymbolView name={item.icon} size={20} tintColor={theme.actionPrimary} />
              </View>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{item.title}</Text>
            </View>
            <View style={styles.itemBody}>
              <Text style={[styles.sectionCaption, { color: theme.textSecondary }]}>
                WHAT IS IT?
              </Text>
              <Text style={[styles.definition, { color: theme.textPrimary }]}>
                {item.definition}
              </Text>
              <Text style={[styles.sectionCaption, styles.calcCaption, { color: theme.textSecondary }]}>
                HOW IT&apos;S CALCULATED
              </Text>
              <Text style={[styles.calculation, { color: theme.textSecondary }]}>
                {item.calculation}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { fontSize: 17, fontWeight: '600' },
  doneButton: { position: 'absolute', right: 16, top: 14 },
  done: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, paddingTop: 56, gap: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700' },
  intro: { fontSize: 17 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  item: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    gap: 12,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 17, fontWeight: '600' },
  itemBody: { paddingLeft: 44, gap: 8 },
  sectionCaption: { fontSize: 12, fontWeight: '700' },
  calcCaption: { paddingTop: 4 },
  definition: { fontSize: 15 },
  calculation: {
    fontSize: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
