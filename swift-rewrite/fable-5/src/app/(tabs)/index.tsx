// TEMPORARY spike harness (task 7): week chart seeded with the IMG_4796 data
// for side-by-side comparison. real dashboard lands in task 17.
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { Card } from '@/components/common/Card';
import { Screen } from '@/components/common/Screen';
import { WeekChart, type WeekChartDay } from '@/components/charts/WeekChart';

const bed = (h: number, m: number) => ((h < 18 ? h + 24 : h) + m / 60) - 18;
const wake = (h: number, m: number) => h + m / 60 + 24 - 18;

const DAYS: WeekChartDay[] = [
  { dayLabel: 'Thu', dateLabel: 'Thu, Jul 10', startOffset: bed(23, 50), endOffset: wake(6, 44), durationSeconds: 6.9 * 3600, changePercent: null },
  { dayLabel: 'Fri', dateLabel: 'Fri, Jul 11', startOffset: bed(1, 10), endOffset: wake(7, 45), durationSeconds: 6.6 * 3600, changePercent: -4 },
  { dayLabel: 'Sat', dateLabel: 'Sat, Jul 12', startOffset: bed(23, 20), endOffset: wake(7, 20), durationSeconds: 8.0 * 3600, changePercent: 21 },
  { dayLabel: 'Sun', dateLabel: 'Sun, Jul 13', startOffset: bed(0, 20), endOffset: wake(7, 55), durationSeconds: 7.6 * 3600, changePercent: -5 },
  { dayLabel: 'Mon', dateLabel: 'Mon, Jul 14', startOffset: bed(1, 0), endOffset: wake(7, 18), durationSeconds: 6.3 * 3600, changePercent: -17 },
  { dayLabel: 'Tue', dateLabel: 'Tue, Jul 15', startOffset: bed(0, 30), endOffset: wake(7, 36), durationSeconds: 7.1 * 3600, changePercent: 13 },
  { dayLabel: 'Wed', dateLabel: 'Wed, Jul 16', startOffset: bed(0, 45), endOffset: wake(7, 21), durationSeconds: 6.6 * 3600, changePercent: -6 },
];

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = width - 16 * 2 - 16 * 2;
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <WeekChart
            days={DAYS}
            optimalSleepMinutes={30}
            optimalWakeMinutes={7 * 60 + 30}
            width={chartWidth}
            height={300}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 80, paddingHorizontal: 16 },
  card: {},
});
