import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CardBackground, CircularTimePicker, ScreenChrome } from '@/components/common';
import { rgba } from '@/components/common/color';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import type { AppTheme } from '@/theme';
import {
  useSleepAppearanceTheme,
  useSleepSettings,
  useUpdateSleepSettings,
} from '@/theme/sleep-appearance';

import { formatGoalDurationLabel, formatSettingsClockTime } from '../settings/settings-model';
import {
  completeOnboardingSettings,
  getOnboardingProgressLabel,
  nextOnboardingStep,
  previousOnboardingStep,
  type OnboardingStep,
} from './onboarding-model';

type PermissionState = 'idle' | 'granted' | 'denied';

function OnboardingButton({
  disabled = false,
  onPress,
  title,
  tone = 'primary',
  theme,
}: {
  disabled?: boolean;
  onPress: () => void;
  title: string;
  tone?: 'primary' | 'secondary';
  theme: AppTheme;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: tone === 'primary' ? theme.actionPrimary : rgba(theme.textPrimary, 0.08),
          borderColor: tone === 'primary' ? rgba(theme.actionPrimary, 0.48) : rgba(theme.textPrimary, 0.16),
          opacity: disabled ? 0.55 : 1,
        },
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.buttonText, { color: tone === 'primary' ? '#ffffff' : theme.textPrimary }]}>{title}</Text>
    </Pressable>
  );
}

function StepShell({
  children,
  eyebrow,
  theme,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  theme: AppTheme;
  title: string;
}) {
  return (
    <CardBackground theme={theme} recipe="large" style={styles.card}>
      <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>{eyebrow}</Text>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      {children}
    </CardBackground>
  );
}

function WelcomeStep({ theme }: { theme: AppTheme }) {
  return (
    <StepShell eyebrow="welcome" theme={theme} title="Track sleep without the noise">
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Twilight focuses on bedtime, wake time, consistency, and gentle reminders. Start with a goal and refine from real nights.
      </Text>
      <View style={styles.promiseGrid}>
        {['simple sleep logs', 'goal-aware metrics', 'night-first visuals'].map((item) => (
          <View
            key={item}
            style={[styles.promisePill, { backgroundColor: rgba(theme.textPrimary, 0.07), borderColor: rgba(theme.textPrimary, 0.12) }]}>
            <Text style={[styles.promiseText, { color: theme.textPrimary }]}>{item}</Text>
          </View>
        ))}
      </View>
    </StepShell>
  );
}

function ScheduleStep({
  onChange,
  sleepMinutes,
  theme,
  wakeMinutes,
}: {
  onChange: (change: { sleepMinutes: number; wakeMinutes: number }) => void;
  sleepMinutes: number;
  theme: AppTheme;
  wakeMinutes: number;
}) {
  return (
    <StepShell eyebrow="sleep schedule" theme={theme} title="Set your ideal window">
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        This goal powers the dashboard, editor score, and wind-down reminder timing.
      </Text>
      <View style={styles.pickerFrame}>
        <CircularTimePicker
          onChange={onChange}
          sleepMinutes={sleepMinutes}
          theme={theme}
          wakeMinutes={wakeMinutes}
        />
      </View>
      <View style={[styles.summaryRow, { borderColor: rgba(theme.textPrimary, 0.12), backgroundColor: rgba(theme.textPrimary, 0.06) }]}>
        <Text style={[styles.summaryText, { color: theme.textPrimary }]}>
          {formatSettingsClockTime(sleepMinutes)} to {formatSettingsClockTime(wakeMinutes)}
        </Text>
        <Text style={[styles.summaryMeta, { color: theme.textSecondary }]}>
          {formatGoalDurationLabel(sleepMinutes, wakeMinutes)}
        </Text>
      </View>
    </StepShell>
  );
}

function NotificationsStep({
  onRequestPermission,
  permissionState,
  theme,
}: {
  onRequestPermission: () => void;
  permissionState: PermissionState;
  theme: AppTheme;
}) {
  const label = permissionState === 'granted' ? 'reminders allowed' : permissionState === 'denied' ? 'permission skipped' : 'not asked yet';

  return (
    <StepShell eyebrow="reminders" theme={theme} title="Prepare before bedtime">
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Twilight can remind you three hours before your target bedtime and will keep the reminder aligned with your settings.
      </Text>
      <View style={[styles.permissionCard, { backgroundColor: rgba(theme.textPrimary, 0.07), borderColor: rgba(theme.textPrimary, 0.12) }]}>
        <Text style={[styles.permissionTitle, { color: theme.textPrimary }]}>Notification permission</Text>
        <Text style={[styles.permissionBody, { color: theme.textSecondary }]}>{label}</Text>
        <OnboardingButton onPress={onRequestPermission} title="Allow reminders" theme={theme} />
      </View>
    </StepShell>
  );
}

function FinishStep({
  sleepMinutes,
  theme,
  wakeMinutes,
}: {
  sleepMinutes: number;
  theme: AppTheme;
  wakeMinutes: number;
}) {
  return (
    <StepShell eyebrow="ready" theme={theme} title="Your first night is ready">
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Start sleep mode from the dashboard tonight. You can edit the goal anytime in Settings.
      </Text>
      <View style={[styles.finishCard, { backgroundColor: rgba(theme.actionPrimary, 0.16), borderColor: rgba(theme.actionPrimary, 0.34) }]}>
        <Text style={[styles.finishTitle, { color: theme.textPrimary }]}>Goal saved after finish</Text>
        <Text style={[styles.finishBody, { color: theme.textSecondary }]}>
          {formatSettingsClockTime(sleepMinutes)} to {formatSettingsClockTime(wakeMinutes)} · {formatGoalDurationLabel(sleepMinutes, wakeMinutes)}
        </Text>
      </View>
    </StepShell>
  );
}

function renderStep({
  onChangeSchedule,
  onRequestPermission,
  permissionState,
  sleepMinutes,
  step,
  theme,
  wakeMinutes,
}: {
  onChangeSchedule: (change: { sleepMinutes: number; wakeMinutes: number }) => void;
  onRequestPermission: () => void;
  permissionState: PermissionState;
  sleepMinutes: number;
  step: OnboardingStep;
  theme: AppTheme;
  wakeMinutes: number;
}) {
  switch (step) {
    case 'welcome':
      return <WelcomeStep theme={theme} />;
    case 'schedule':
      return (
        <ScheduleStep
          onChange={onChangeSchedule}
          sleepMinutes={sleepMinutes}
          theme={theme}
          wakeMinutes={wakeMinutes}
        />
      );
    case 'notifications':
      return (
        <NotificationsStep
          onRequestPermission={onRequestPermission}
          permissionState={permissionState}
          theme={theme}
        />
      );
    case 'finish':
      return <FinishStep sleepMinutes={sleepMinutes} theme={theme} wakeMinutes={wakeMinutes} />;
  }
}

export function OnboardingScreen() {
  const theme = useSleepAppearanceTheme();
  const settings = useSleepSettings();
  const updateSettings = useUpdateSleepSettings();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [sleepMinutes, setSleepMinutes] = useState(settings.optimalSleepMinutes);
  const [wakeMinutes, setWakeMinutes] = useState(settings.optimalWakeMinutes);
  const [permissionState, setPermissionState] = useState<PermissionState>('idle');
  const [saving, setSaving] = useState(false);
  const progressLabel = useMemo(() => getOnboardingProgressLabel(step), [step]);

  async function requestNotificationPermission() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('wind-down', {
        importance: Notifications.AndroidImportance.DEFAULT,
        name: 'Wind-down reminders',
      });
    }

    const result = await Notifications.requestPermissionsAsync();
    setPermissionState(result.granted ? 'granted' : 'denied');
  }

  async function finishOnboarding() {
    setSaving(true);

    try {
      await updateSettings(completeOnboardingSettings(settings, { sleepMinutes, wakeMinutes }));
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  }

  function onPrimaryPress() {
    if (step === 'finish') {
      void finishOnboarding();
      return;
    }

    setStep(nextOnboardingStep(step));
  }

  return (
    <ScreenChrome theme={theme}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>{progressLabel}</Text>
          {step !== 'welcome' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="go back one onboarding step"
              onPress={() => setStep(previousOnboardingStep(step))}
              style={({ pressed }) => [
                styles.backButton,
                { borderColor: rgba(theme.textPrimary, 0.14), backgroundColor: rgba(theme.textPrimary, 0.08) },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.backButtonText, { color: theme.textPrimary }]}>Back</Text>
            </Pressable>
          ) : null}
        </View>
        {renderStep({
          onChangeSchedule: (change) => {
            setSleepMinutes(change.sleepMinutes);
            setWakeMinutes(change.wakeMinutes);
          },
          onRequestPermission: () => {
            void requestNotificationPermission();
          },
          permissionState,
          sleepMinutes,
          step,
          theme,
          wakeMinutes,
        })}
        <View style={styles.footer}>
          {step === 'notifications' ? (
            <OnboardingButton
              onPress={() => setStep(nextOnboardingStep(step))}
              title="Not now"
              tone="secondary"
              theme={theme}
            />
          ) : null}
          <OnboardingButton
            disabled={saving}
            onPress={onPrimaryPress}
            title={step === 'finish' ? 'Finish setup' : 'Continue'}
            theme={theme}
          />
        </View>
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  backButton: {
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  body: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
    marginTop: Spacing.three,
  },
  button: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
  },
  card: {
    marginHorizontal: Spacing.two,
  },
  content: {
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    paddingTop: Spacing.four,
    width: '100%',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  finishBody: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: Spacing.one,
  },
  finishCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: Spacing.four,
    padding: Spacing.three,
  },
  finishTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  footer: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  permissionBody: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: Spacing.three,
    marginTop: Spacing.one,
  },
  permissionCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: Spacing.four,
    padding: Spacing.three,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  pickerFrame: {
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  promiseGrid: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  promisePill: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three,
  },
  promiseText: {
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  summaryMeta: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  summaryRow: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.4,
    lineHeight: 48,
    marginTop: Spacing.one,
  },
});
