// ports: twilight/views/sleeponboardingview.swift

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInSlide } from '@/components/common/fade-in-slide';
import { GlowingMoonView } from '@/components/common/glowing-moon-view';
import { PlatformSymbol } from '@/components/common/platform-symbol';
import { ScreenBackground } from '@/components/common/screen-background';
import {
  OnboardingFooter,
  OnboardingPrimaryButton,
  OnboardingToolbar,
} from '@/components/onboarding/onboarding-controls';
import { formatGoalDuration } from '@/components/settings/settings-model';
import { useOnboarding } from '@/onboarding/OnboardingProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function FinishOnboardingRoute() {
  const router = useRouter();
  const { completeOnboarding, draftSchedule } = useOnboarding();
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const finish = async () => {
    setIsFinishing(true);
    setError(null);
    try {
      await completeOnboarding();
    } catch {
      setError('Twilight could not save your setup. Please try again.');
      setIsFinishing(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel="Finish onboarding" style={styles.safeArea}>
        <OnboardingToolbar onBack={() => router.back()} step={4} />
        <View style={styles.content}>
          <View style={styles.spacer} />
          <FadeInSlide>
            <View style={styles.moon}>
              <GlowingMoonView size={112} />
            </View>
          </FadeInSlide>
          <FadeInSlide delay={140}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>Your nights have a new rhythm</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Twilight is ready to help you notice patterns without turning sleep into homework.</Text>
          </FadeInSlide>
          <FadeInSlide delay={260}>
            <View style={[styles.summaryCard, { backgroundColor: theme.cardBackground }]}>
              <ScheduleValue
                color="#7b68ee"
                icon="moon.fill"
                label="Bedtime"
                minutes={draftSchedule.sleepMinutes}
              />
              <View style={[styles.divider, { backgroundColor: `${theme.textSecondary}32` }]} />
              <ScheduleValue
                color="#ffb347"
                icon="sun.max.fill"
                label="Wake up"
                minutes={draftSchedule.wakeMinutes}
              />
              <View style={[styles.goal, { backgroundColor: theme.actionSecondary }]}>
                <PlatformSymbol androidName="time-outline" color={theme.textPrimary} size={16} symbol="clock" />
                <Text style={[styles.goalText, { color: theme.textPrimary }]}>{formatGoalDuration(draftSchedule.sleepMinutes, draftSchedule.wakeMinutes)}</Text>
              </View>
            </View>
          </FadeInSlide>
          {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.warning }]}>{error}</Text> : null}
          <View style={styles.spacer} />
        </View>
        <OnboardingFooter>
          <OnboardingPrimaryButton busy={isFinishing} onPress={() => void finish()} title="Start Tracking Sleep" />
        </OnboardingFooter>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function ScheduleValue({
  color,
  icon,
  label,
  minutes,
}: {
  color: string;
  icon: 'moon.fill' | 'sun.max.fill';
  label: 'Bedtime' | 'Wake up';
  minutes: number;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.scheduleValue}>
      <PlatformSymbol androidName={label === 'Bedtime' ? 'moon' : 'sunny'} color={color} size={20} symbol={icon} />
      <View style={styles.flex}>
        <Text style={[styles.scheduleLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.scheduleTime, { color: theme.textPrimary }]}>{formatClock(minutes)}</Text>
      </View>
    </View>
  );
}

function formatClock(minutes: number): string {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  return `${hour % 12 || 12}:${String(normalized % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 24 },
  divider: { height: StyleSheet.hairlineWidth },
  error: { fontSize: 14, fontWeight: '600', marginTop: 18, textAlign: 'center' },
  flex: { flex: 1 },
  goal: { alignItems: 'center', alignSelf: 'center', borderRadius: 14, flexDirection: 'row', gap: 7, marginTop: 15, paddingHorizontal: 16, paddingVertical: 9 },
  goalText: { fontSize: 13, fontWeight: '800' },
  moon: { alignItems: 'center' },
  safeArea: { flex: 1 },
  scheduleLabel: { fontSize: 12, fontWeight: '700' },
  scheduleTime: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  scheduleValue: { alignItems: 'center', flexDirection: 'row', gap: 13, paddingVertical: 10 },
  spacer: { flex: 1 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 10, paddingHorizontal: 7, textAlign: 'center' },
  summaryCard: { borderColor: 'rgba(255,255,255,0.18)', borderRadius: 22, borderWidth: 1, marginTop: 26, padding: 18 },
  title: { fontSize: 30, fontWeight: '800', lineHeight: 36, marginTop: 26, textAlign: 'center' },
});
