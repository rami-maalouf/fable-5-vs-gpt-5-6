// ports: twilight/views/onboarding/sleepschedulestepview.swift

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircularTimePicker } from '@/components/common/CircularTimePicker';
import { FadeInSlide } from '@/components/common/fade-in-slide';
import { PlatformSymbol } from '@/components/common/platform-symbol';
import { ScreenBackground } from '@/components/common/screen-background';
import {
  OnboardingFooter,
  OnboardingPrimaryButton,
  OnboardingToolbar,
} from '@/components/onboarding/onboarding-controls';
import { useOnboarding } from '@/onboarding/OnboardingProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function SleepScheduleOnboardingRoute() {
  const router = useRouter();
  const { draftSchedule, setDraftSchedule } = useOnboarding();
  const { theme } = useTheme();
  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel="Choose your sleep schedule" style={styles.safeArea}>
        <OnboardingToolbar onBack={() => router.back()} step={2} />
        <View style={styles.content}>
          <FadeInSlide>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>Design your (realistic) ideal night</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Drag the moon and sun to adjust your sleep schedule.</Text>
          </FadeInSlide>
          <FadeInSlide delay={120}>
            <View style={styles.pickerFrame}>
              <CircularTimePicker
                onChange={setDraftSchedule}
                size={250}
                sleepMinutes={draftSchedule.sleepMinutes}
                wakeMinutes={draftSchedule.wakeMinutes}
              />
            </View>
          </FadeInSlide>
          <FadeInSlide delay={240}>
            <View style={styles.timeRow}>
              <TimeCard color="#7b68ee" icon="moon.fill" label="Sleep" minutes={draftSchedule.sleepMinutes} />
              <TimeCard color="#ffb347" icon="sun.max.fill" label="Wake" minutes={draftSchedule.wakeMinutes} />
            </View>
          </FadeInSlide>
        </View>
        <OnboardingFooter>
          <OnboardingPrimaryButton onPress={() => router.push('/onboarding/notifications')} title="Continue" />
        </OnboardingFooter>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function TimeCard({
  color,
  icon,
  label,
  minutes,
}: {
  color: string;
  icon: 'moon.fill' | 'sun.max.fill';
  label: 'Sleep' | 'Wake';
  minutes: number;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.timeCard, { backgroundColor: theme.cardBackground, borderColor: `${color}42` }]}>
      <View style={styles.timeLabelRow}>
        <PlatformSymbol androidName={label === 'Sleep' ? 'moon' : 'sunny'} color={color} size={15} symbol={icon} />
        <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.timeValue, { color: theme.textPrimary }]}>{formatClock(minutes)}</Text>
    </View>
  );
}

function formatClock(minutes: number): string {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  return `${hour % 12 || 12}:${String(normalized % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', flex: 1, paddingHorizontal: 18, paddingTop: 12 },
  pickerFrame: { alignItems: 'center', height: 330, justifyContent: 'center', marginTop: 8 },
  safeArea: { flex: 1 },
  subtitle: { fontSize: 15, lineHeight: 21, marginTop: 8, paddingHorizontal: 18, textAlign: 'center' },
  timeCard: { alignItems: 'center', borderRadius: 14, borderWidth: 1, minWidth: 132, paddingHorizontal: 20, paddingVertical: 11 },
  timeLabel: { fontSize: 12, fontWeight: '600' },
  timeLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  timeRow: { flexDirection: 'row', gap: 22, justifyContent: 'center' },
  timeValue: { fontSize: 20, fontWeight: '700', marginTop: 5 },
  title: { fontSize: 25, fontWeight: '800', lineHeight: 31, textAlign: 'center' },
});
