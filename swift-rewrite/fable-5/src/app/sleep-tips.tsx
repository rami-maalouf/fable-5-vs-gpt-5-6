// ports: Views/SleepHygieneTipsView.swift - the wind-down routine timeline
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { useSettings } from '@/state/settings-state';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';

const TIMELINE = [
  {
    hoursBefore: 3,
    emoji: '🍽️',
    color: '#ffcc00',
    items: ['Finish your last meal', 'Switch to water only', 'No more caffeine or alcohol'],
  },
  {
    hoursBefore: 2,
    emoji: '💡',
    color: '#ff9500',
    items: [
      'Dim overhead lights & Switch to lamps or candles',
      'Stop water intake',
      'Enable night mode + blue light filters on devices',
    ],
  },
  {
    hoursBefore: 1,
    emoji: '📵',
    color: '#af52de',
    items: [
      'Stop all stimulating activities',
      'Do something relaxing (read, stretch)',
      'Keep your room between 17-20°C (63-68°F)',
    ],
  },
  {
    hoursBefore: 0,
    emoji: '🛏️',
    color: '#5856d6',
    items: ['Complete darkness', 'Quiet environment', 'Start the timer here ;)'],
  },
];

function clockString(minutes: number): string {
  const wrapped = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.trunc(wrapped / 60);
  const m = wrapped % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function SleepTipsScreen() {
  const theme = useTheme();
  const fixed = useFixedColor();
  const optimalSleepMinutes = useSettings((s) => s.optimalSleepMinutes);

  return (
    <Screen starCount={20}>
      <View style={styles.navOverlay} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.doneButton}>
          <Text style={[styles.done, { color: theme.actionPrimary }]}>Done</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Your Wind-Down Routine</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Follow this timeline for better sleep
          </Text>
        </View>

        <View>
          {TIMELINE.map((step, index) => {
            const time = clockString(optimalSleepMinutes - step.hoursBefore * 60);
            const label =
              step.hoursBefore === 0
                ? `${time} (Bedtime)`
                : `${time} (${step.hoursBefore} Hour${step.hoursBefore > 1 ? 's' : ''} Before)`;
            const isLast = index === TIMELINE.length - 1;
            return (
              <View key={step.hoursBefore} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, { backgroundColor: fixed(step.color) }]}>
                    <Text style={styles.timelineEmoji}>{step.emoji}</Text>
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineBody}>
                  <Text style={[styles.timelineTime, { color: fixed(step.color) }]}>{label}</Text>
                  {step.items.map((item) => (
                    <Text key={item} style={[styles.timelineItem, { color: theme.textPrimary }]}>
                      •  {item}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.whyCard}>
          <Text style={[styles.whyTitle, { color: theme.textPrimary }]}>Why This Works</Text>
          <Text style={[styles.whyBody, { color: theme.textSecondary }]}>
            Your body needs time to transition to sleep mode. Bright lights suppress melatonin,
            late meals keep your digestive system active, and screens stimulate your brain.
            Following this routine signals to your body that it&apos;s time to rest.
          </Text>
        </View>
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
  },
  doneButton: { position: 'absolute', right: 16, top: 14 },
  done: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, paddingTop: 56, gap: 24, paddingBottom: 48 },
  header: { gap: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15 },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineRail: { alignItems: 'center', width: 44 },
  timelineDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineEmoji: { fontSize: 20 },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 6,
  },
  timelineBody: { flex: 1, gap: 5, paddingBottom: 26 },
  timelineTime: { fontSize: 15, fontWeight: '600' },
  timelineItem: { fontSize: 14 },
  whyCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 12,
  },
  whyTitle: { fontSize: 17, fontWeight: '600' },
  whyBody: { fontSize: 15, lineHeight: 21 },
});
