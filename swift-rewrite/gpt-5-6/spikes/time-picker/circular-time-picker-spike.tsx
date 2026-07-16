import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CircularTimePicker,
  type CircularTimePickerValue,
} from '@/components/common/CircularTimePicker';
import { GlassCard } from '@/components/common/glass-card';
import { ScreenBackground } from '@/components/common/screen-background';
import { useTheme } from '@/theme/ThemeProvider';

const initialValue = { sleepMinutes: 30, wakeMinutes: 7 * 60 + 30 };

export default function CircularTimePickerSpike() {
  const { theme } = useTheme();
  const [value, setValue] = useState<CircularTimePickerValue>(initialValue);

  return (
    <ScreenBackground>
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>SLEEP SCHEDULE</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Set your sleep window</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Drag either handle around the clock</Text>
        </View>

        <View style={styles.pickerFrame}>
          <CircularTimePicker
            onChange={setValue}
            sleepMinutes={value.sleepMinutes}
            wakeMinutes={value.wakeMinutes}
          />
        </View>

        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <ScheduleValue color="#9b8cff" label="BEDTIME" minutes={value.sleepMinutes} />
            <View style={styles.divider} />
            <ScheduleValue color="#ffb347" label="WAKE UP" minutes={value.wakeMinutes} />
          </View>
        </GlassCard>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function ScheduleValue({ color, label, minutes }: { color: string; label: string; minutes: number }) {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalizedMinutes / 60);
  const minute = normalizedMinutes % 60;
  const displayHour = hour % 12 || 12;
  const period = hour < 12 ? 'AM' : 'PM';

  return (
    <View style={styles.scheduleValue}>
      <Text style={[styles.scheduleLabel, { color }]}>{label}</Text>
      <Text style={[styles.scheduleTime, { color }]}>{`${displayHour}:${String(minute).padStart(2, '0')} ${period}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { backgroundColor: 'rgba(255,255,255,0.14)', height: 42, width: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  header: { paddingHorizontal: 22, paddingTop: 14 },
  pickerFrame: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  safeArea: { flex: 1 },
  scheduleLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  scheduleTime: { fontSize: 20, fontVariant: ['tabular-nums'], fontWeight: '800', marginTop: 3 },
  scheduleValue: { alignItems: 'center', flex: 1 },
  subtitle: { fontSize: 13, marginTop: 4 },
  summaryCard: {
    marginBottom: 18,
    marginHorizontal: 18,
  },
  summaryRow: { alignItems: 'center', flexDirection: 'row' },
  title: { fontSize: 28, fontWeight: '800', marginTop: 3 },
});
