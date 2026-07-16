// ports: Views/Onboarding/SleepScheduleStepView.swift (step 2)
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CircularTimePicker } from '@/components/common/CircularTimePicker';
import { FadeInSlide } from '@/components/common/FadeInSlide';
import { Screen } from '@/components/common/Screen';
import { useSettings } from '@/state/settings-state';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';

const MOON_COLOR = '#7b68ee';
const SUN_COLOR = '#ffb347';

function clockLabel(minutes: number): string {
  const h = Math.trunc(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ScheduleStep() {
  const theme = useTheme();
  const fixed = useFixedColor();
  const sleepMinutes = useSettings((s) => s.optimalSleepMinutes);
  const wakeMinutes = useSettings((s) => s.optimalWakeMinutes);
  const setSetting = useSettings((s) => s.setSetting);

  return (
    <Screen starCount={35}>
      <View style={styles.container}>
        <FadeInSlide delay={0} slideOffset={20}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Design your (realistic) ideal night
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Drag the knobs to adjust your sleep schedule.
            </Text>
          </View>
        </FadeInSlide>
        <View style={styles.spacer} />
        <FadeInSlide delay={0.12} slideOffset={24}>
          <View style={styles.pickerWrap}>
            <CircularTimePicker
              size={260}
              sleepMinutes={sleepMinutes}
              wakeMinutes={wakeMinutes}
              onChange={(s, w) => {
                setSetting('optimalSleepMinutes', s);
                setSetting('optimalWakeMinutes', w);
              }}
            />
          </View>
        </FadeInSlide>
        <FadeInSlide delay={0.22} slideOffset={18}>
          <View style={styles.timeLabels}>
            {(
              [
                ['moon.fill', fixed(MOON_COLOR), 'Sleep', sleepMinutes],
                ['sun.max.fill', fixed(SUN_COLOR), 'Wake', wakeMinutes],
              ] as const
            ).map(([icon, color, label, minutes]) => (
              <View key={label} style={styles.timeLabel}>
                <SymbolView name={icon} size={16} tintColor={color} />
                <View>
                  <Text style={[styles.timeLabelTitle, { color: theme.textSecondary }]}>
                    {label}
                  </Text>
                  <Text style={[styles.timeLabelValue, { color: theme.textPrimary }]}>
                    {clockLabel(minutes)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInSlide>
        <View style={styles.spacer} />
        <FadeInSlide delay={0.32} slideOffset={18}>
          <Pressable
            testID="schedule-continue"
            onPress={() => router.push('/onboarding/notifications')}
            style={[styles.primaryButton, { backgroundColor: theme.actionPrimary }]}>
            <Text style={styles.primaryLabel}>Continue</Text>
            <SymbolView name="arrow.right" size={15} weight="semibold" tintColor="#ffffff" />
          </Pressable>
        </FadeInSlide>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 70, paddingBottom: 28, gap: 16 },
  header: { gap: 10, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  spacer: { flex: 1 },
  pickerWrap: { alignItems: 'center' },
  timeLabels: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingTop: 8 },
  timeLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeLabelTitle: { fontSize: 12 },
  timeLabelValue: { fontSize: 17, fontWeight: '600' },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 30,
    paddingVertical: 16,
  },
  primaryLabel: { fontSize: 17, fontWeight: '600', color: '#ffffff' },
});
