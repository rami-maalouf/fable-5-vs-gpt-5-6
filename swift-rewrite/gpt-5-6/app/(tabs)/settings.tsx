// ports: twilight/views/blockedprofileview.swift

import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import * as Linking from 'expo-linking';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/common/glass-card';
import { PlatformSymbol } from '@/components/common/platform-symbol';
import { ScreenBackground } from '@/components/common/screen-background';
import {
  dateFromMinutesSinceMidnight,
  formatGoalDuration,
  minutesSinceMidnightFromDate,
  SETTINGS_MODE_OPTIONS,
} from '@/components/settings/settings-model';
import { settingsStore } from '@/data/settings-store';
import type { ThemeMode, ThemePalette } from '@/domain/models';
import { requestNotificationPermission } from '@/services/notification-permissions';
import { reconcileWindDownNotification } from '@/services/notifications';
import { sleepLiveActivityService } from '@/services/live-activity';
import { useActiveSleepSession } from '@/session/ActiveSleepSessionProvider';
import { useTheme } from '@/theme/ThemeProvider';

interface GoalSettings {
  sleepMinutes: number;
  wakeMinutes: number;
}

const COMMUNITY_LINKS = [
  {
    detail: 'Build and learn with the tools behind Twilight.',
    androidIcon: 'book' as const,
    icon: 'sf:book.closed.fill',
    label: 'Expo documentation',
    url: 'https://docs.expo.dev/',
  },
  {
    detail: 'Meet other people making thoughtful apps.',
    androidIcon: 'chatbubbles' as const,
    icon: 'sf:bubble.left.and.bubble.right.fill',
    label: 'Expo community',
    url: 'https://chat.expo.dev/',
  },
] as const;

const supportHeartColor = '#ff375f';

export default function SettingsScreen() {
  const router = useRouter();
  const { activeSession } = useActiveSleepSession();
  const { mode, palette, setMode, setPalette, theme } = useTheme();
  const [goals, setGoals] = useState<GoalSettings | null>(null);
  const [windDownEnabled, setWindDownEnabled] = useState(true);
  const [windDownBusy, setWindDownBusy] = useState(false);
  const [liveActivityEnabled, setLiveActivityEnabled] = useState(true);
  const [liveActivityBusy, setLiveActivityBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(null), 4_500);
    return () => clearTimeout(timeout);
  }, [error]);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      const load = async () => {
        try {
          const [optimalSleepMinutes, optimalWakeMinutes, reminderEnabled, activityEnabled] = await Promise.all([
            settingsStore.get('optimalSleepMinutes'),
            settingsStore.get('optimalWakeMinutes'),
            settingsStore.get('windDownReminderEnabled'),
            settingsStore.get('liveActivityEnabled'),
          ]);
          if (isCurrent) {
            setGoals({ sleepMinutes: optimalSleepMinutes, wakeMinutes: optimalWakeMinutes });
            setWindDownEnabled(reminderEnabled);
            setLiveActivityEnabled(activityEnabled);
            setError(null);
          }
        } catch {
          if (isCurrent) {
            setError('Twilight could not load your settings.');
          }
        }
      };
      void load();
      return () => {
        isCurrent = false;
      };
    }, []),
  );

  const updateGoal = async (key: keyof GoalSettings, value: number) => {
    const settingKey = key === 'sleepMinutes' ? 'optimalSleepMinutes' : 'optimalWakeMinutes';
    setGoals((current) => (current ? { ...current, [key]: value } : current));
    setError(null);
    try {
      await settingsStore.set(settingKey, value);
    } catch {
      setError('Twilight could not save your sleep goal.');
      return;
    }
    if (key !== 'sleepMinutes' || !windDownEnabled) return;
    try {
      const result = await reconcileWindDownNotification({
        bedtimeMinutes: value,
        enabled: true,
      });
      if (result.status === 'permission-denied') {
        setWindDownEnabled(false);
        await settingsStore.set('windDownReminderEnabled', false);
        setError('Notification access is off. Your wind-down reminder was disabled.');
      }
    } catch {
      setError('Your bedtime was saved, but the wind-down reminder could not be rescheduled.');
    }
  };

  const updateWindDown = async (enabled: boolean) => {
    const previous = windDownEnabled;
    setWindDownEnabled(enabled);
    setWindDownBusy(true);
    setError(null);
    try {
      if (enabled) {
        const authorized = await requestNotificationPermission();
        if (!authorized) {
          setWindDownEnabled(false);
          await settingsStore.set('windDownReminderEnabled', false);
          await reconcileWindDownNotification({
            bedtimeMinutes: goals?.sleepMinutes ?? 22 * 60,
            enabled: false,
          });
          setError('Notification access is off. Enable it in system Settings to use reminders.');
          return;
        }
      }
      await settingsStore.set('windDownReminderEnabled', enabled);
      const result = await reconcileWindDownNotification({
        bedtimeMinutes: goals?.sleepMinutes ?? 22 * 60,
        enabled,
      });
      if (result.status === 'permission-denied') {
        setWindDownEnabled(false);
        await settingsStore.set('windDownReminderEnabled', false);
        setError('Notification access is off. Enable it in system Settings to use reminders.');
      }
    } catch {
      setWindDownEnabled(previous);
      try {
        await settingsStore.set('windDownReminderEnabled', previous);
        await reconcileWindDownNotification({
          bedtimeMinutes: goals?.sleepMinutes ?? 22 * 60,
          enabled: previous,
        });
      } catch {
        // the toast below keeps the failure visible while launch reconciliation retries later.
      }
      setError('Twilight could not update your scheduled reminder.');
    } finally {
      setWindDownBusy(false);
    }
  };

  const updateLiveActivity = async (enabled: boolean) => {
    const previous = liveActivityEnabled;
    setLiveActivityEnabled(enabled);
    setLiveActivityBusy(true);
    setError(null);
    try {
      await settingsStore.set('liveActivityEnabled', enabled);
      await sleepLiveActivityService.reconcile(activeSession);
    } catch {
      setLiveActivityEnabled(previous);
      try {
        await settingsStore.set('liveActivityEnabled', previous);
        await sleepLiveActivityService.reconcile(activeSession);
      } catch {
        // launch reconciliation will repair the activity projection later.
      }
      setError('Twilight could not update Live Activity.');
    } finally {
      setLiveActivityBusy(false);
    }
  };

  const updateMode = async (nextMode: ThemeMode) => {
    setError(null);
    try {
      await setMode(nextMode);
    } catch {
      setError('Twilight could not save your display mode.');
    }
  };

  const updatePalette = async (nextPalette: ThemePalette) => {
    setError(null);
    try {
      await setPalette(nextPalette);
    } catch {
      setError('Twilight could not save your theme color.');
    }
  };

  const openCommunityLink = async (url: string) => {
    setError(null);
    try {
      await Linking.openURL(url);
    } catch {
      setError('Twilight could not open that link.');
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel="Settings screen" edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>
            Sleep Settings
          </Text>

          <Pressable
            accessibilityRole="link"
            onPress={() => void openCommunityLink('https://chat.expo.dev/')}
            style={({ pressed }) => [
              styles.supportRow,
              { backgroundColor: theme.cardBackground },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.supportIcon, { backgroundColor: `${supportHeartColor}22` }]}>
              <PlatformSymbol androidName="heart" color={supportHeartColor} size={22} symbol="heart.fill" />
            </View>
            <Text numberOfLines={1} style={[styles.supportTitle, { color: theme.textPrimary }]}>
              Indie-built. <Text style={{ color: theme.textSecondary, fontWeight: '500' }}>Community-supported</Text>
            </Text>
            <PlatformSymbol androidName="chevron-forward" color={theme.textSecondary} size={14} symbol="chevron.right" />
          </Pressable>

          <SectionTitle title="Sleep Goal" />
          <GlassCard style={styles.cardFlush}>
            {!goals ? (
              <View style={styles.loadingGoal}>
                <ActivityIndicator color={theme.accent} />
              </View>
            ) : (
              <>
                <View style={styles.goalRow}>
                  <TimePickerField
                    color="#7b68ee"
                    androidIcon="moon"
                    icon="moon.fill"
                    label="Bedtime"
                    minutes={goals.sleepMinutes}
                    onChange={(date) => void updateGoal('sleepMinutes', minutesSinceMidnightFromDate(date))}
                  />
                  <View style={[styles.goalConnector, { backgroundColor: theme.textSecondary }]} />
                  <TimePickerField
                    color="#ffb347"
                    androidIcon="sunny"
                    icon="sun.max.fill"
                    label="Wake Up"
                    minutes={goals.wakeMinutes}
                    onChange={(date) => void updateGoal('wakeMinutes', minutesSinceMidnightFromDate(date))}
                  />
                </View>
                <View style={[styles.goalChip, { backgroundColor: theme.actionSecondary }]}>
                  <PlatformSymbol androidName="time-outline" color={theme.textPrimary} size={16} symbol="clock" />
                  <Text style={[styles.goalChipText, { color: theme.textPrimary }]}>
                    {formatGoalDuration(goals.sleepMinutes, goals.wakeMinutes)}
                  </Text>
                </View>
              </>
            )}
          </GlassCard>

          <SectionTitle title="App Appearance" />
          <GlassCard style={styles.cardFlush}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Display Mode</Text>
            <View
              accessibilityLabel="Display mode"
              accessibilityRole="tablist"
              style={[styles.segmentedControl, { backgroundColor: theme.actionSecondary }]}
            >
              {SETTINGS_MODE_OPTIONS.map((option) => {
                const selected = mode === option.value;
                return (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    key={option.value}
                    onPress={() => void updateMode(option.value)}
                    style={({ pressed }) => [
                      styles.segment,
                      selected && { backgroundColor: theme.textPrimary },
                      pressed && styles.pressed,
                    ]}
                    testID={`settings-mode-${option.value}`}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: selected ? theme.backgroundGradient[0] : theme.textPrimary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.settingLabel, styles.paletteTitle, { color: theme.textPrimary }]}>Theme Color</Text>
            <View style={styles.paletteRow}>
              <PaletteButton
                colors={['#0a1520', '#00d4ff']}
                label="Twilight"
                onPress={() => void updatePalette('twilight')}
                selected={palette === 'twilight'}
              />
              <PaletteButton
                colors={['#0c1445', '#4f5bd5']}
                label="Amethyst"
                onPress={() => void updatePalette('amethyst')}
                selected={palette === 'amethyst'}
              />
            </View>
          </GlassCard>

          <SectionTitle title="Wind-Down" />
          <GlassCard style={styles.cardFlush}>
            <View style={styles.preferenceRow}>
              <View style={[styles.rowIcon, { backgroundColor: `${theme.accent}22` }]}>
                <PlatformSymbol androidName="notifications" color={theme.accent} size={20} symbol="bell.fill" />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Wind-down reminder</Text>
                <Text style={[styles.rowDetail, { color: theme.textSecondary }]}>A gentle nudge before bedtime</Text>
              </View>
              <Switch
                accessibilityLabel="Wind-down reminder"
                disabled={windDownBusy}
                onValueChange={(enabled) => void updateWindDown(enabled)}
                thumbColor="#ffffff"
                trackColor={{ false: theme.actionSecondary, true: theme.actionPrimary }}
                value={windDownEnabled}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: `${theme.textSecondary}35` }]} />
            <SettingsLinkRow
              detail="Small habits for calmer nights"
              androidIcon="leaf"
              icon="leaf.fill"
              label="Sleep hygiene tips"
              onPress={() => router.push('/sleep-tips')}
            />
          </GlassCard>

          {Platform.OS === 'ios' ? (
            <>
              <SectionTitle title="Live Activity" />
              <GlassCard style={styles.cardFlush}>
                <View style={styles.preferenceRow}>
                  <View style={[styles.rowIcon, { backgroundColor: `${theme.accent}22` }]}>
                    <PlatformSymbol androidName="moon" color={theme.accent} size={20} symbol="moon.stars.fill" />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Sleep progress</Text>
                    <Text style={[styles.rowDetail, { color: theme.textSecondary }]}>Show elapsed time and your goal</Text>
                  </View>
                  <Switch
                    accessibilityLabel="Sleep Live Activity"
                    disabled={liveActivityBusy}
                    onValueChange={(enabled) => void updateLiveActivity(enabled)}
                    thumbColor="#ffffff"
                    trackColor={{ false: theme.actionSecondary, true: theme.actionPrimary }}
                    value={liveActivityEnabled}
                  />
                </View>
              </GlassCard>
            </>
          ) : null}

          <SectionTitle title="Community" />
          <GlassCard style={styles.cardFlush}>
            {COMMUNITY_LINKS.map((link, index) => (
              <View key={link.url}>
                {index > 0 ? <View style={[styles.divider, { backgroundColor: `${theme.textSecondary}35` }]} /> : null}
                <SettingsLinkRow
                  detail={link.detail}
                  androidIcon={link.androidIcon}
                  icon={link.icon}
                  label={link.label}
                  onPress={() => void openCommunityLink(link.url)}
                />
              </View>
            ))}
          </GlassCard>

        </ScrollView>
        {error ? (
          <View accessibilityRole="alert" style={[styles.errorToast, { backgroundColor: theme.cardBackground }]}>
            <PlatformSymbol androidName="warning" color={theme.warning} size={18} symbol="exclamationmark.triangle.fill" />
            <Text style={[styles.errorToastText, { color: theme.textPrimary }]}>{error}</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </ScreenBackground>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { theme } = useTheme();
  return <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>;
}

function TimePickerField({
  androidIcon,
  color,
  icon,
  label,
  minutes,
  onChange,
}: {
  androidIcon: 'moon' | 'sunny';
  color: string;
  icon: string;
  label: string;
  minutes: number;
  onChange(date: Date): void;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.timeField}>
      <View style={styles.timeLabelRow}>
        <PlatformSymbol androidName={androidIcon} color={color} size={16} symbol={icon} />
        <Text style={[styles.timeLabel, { color }]}>{label}</Text>
      </View>
      <DateTimePicker
        accentColor={color}
        display="compact"
        mode="time"
        onValueChange={(_event, date) => onChange(date)}
        testID={`settings-${label.toLowerCase().replaceAll(' ', '-')}`}
        themeVariant={theme.colorScheme}
        value={dateFromMinutesSinceMidnight(minutes)}
      />
    </View>
  );
}

function PaletteButton({
  colors,
  label,
  onPress,
  selected,
}: {
  colors: readonly [string, string];
  label: string;
  onPress(): void;
  selected: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.paletteButton,
        {
          backgroundColor: theme.actionSecondary,
          borderColor: selected ? theme.accent : 'transparent',
        },
        pressed && styles.pressed,
      ]}
      testID={`settings-palette-${label.toLowerCase()}`}
    >
      <View style={styles.swatchRow}>
        <View style={[styles.swatch, { backgroundColor: colors[0] }]} />
        <View style={[styles.swatch, styles.swatchOverlap, { backgroundColor: colors[1] }]} />
      </View>
      <Text style={[styles.paletteLabel, { color: theme.textPrimary }]}>{label}</Text>
      {selected ? (
        <View style={styles.selectionIcon}>
          <PlatformSymbol androidName="checkmark-circle" color={theme.accent} size={18} symbol="checkmark.circle.fill" />
        </View>
      ) : null}
    </Pressable>
  );
}

function SettingsLinkRow({
  androidIcon,
  detail,
  icon,
  label,
  onPress,
}: {
  androidIcon: 'book' | 'chatbubbles' | 'leaf';
  detail: string;
  icon: string;
  label: string;
  onPress(): void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.preferenceRow, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${theme.accent}22` }]}>
        <PlatformSymbol androidName={androidIcon} color={theme.accent} size={20} symbol={icon} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{label}</Text>
        <Text style={[styles.rowDetail, { color: theme.textSecondary }]}>{detail}</Text>
      </View>
      <PlatformSymbol androidName="chevron-forward" color={theme.textSecondary} size={14} symbol="chevron.right" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardFlush: { marginHorizontal: 0 },
  content: { paddingBottom: 44, paddingHorizontal: 18 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
  errorToast: { alignItems: 'center', borderColor: 'rgba(255,255,255,0.18)', borderRadius: 16, borderWidth: 1, bottom: 86, flexDirection: 'row', gap: 10, left: 18, paddingHorizontal: 15, paddingVertical: 13, position: 'absolute', right: 18 },
  errorToastText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  flex: { flex: 1 },
  goalChip: { alignItems: 'center', alignSelf: 'center', borderRadius: 14, flexDirection: 'row', gap: 7, marginTop: 22, paddingHorizontal: 16, paddingVertical: 9 },
  goalChipText: { fontSize: 13, fontWeight: '800' },
  goalConnector: { height: 1, marginHorizontal: 6, opacity: 0.4, width: 18 },
  goalRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', paddingTop: 10 },
  loadingGoal: { alignItems: 'center', height: 118, justifyContent: 'center' },
  paletteButton: { alignItems: 'center', borderRadius: 16, borderWidth: 2, flex: 1, minHeight: 100, padding: 12 },
  paletteLabel: { fontSize: 13, fontWeight: '700', marginTop: 9 },
  paletteRow: { flexDirection: 'row', gap: 10 },
  paletteTitle: { marginTop: 20 },
  preferenceRow: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 66, paddingVertical: 8 },
  pressed: { opacity: 0.68 },
  rowDetail: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  rowIcon: { alignItems: 'center', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  safeArea: { flex: 1 },
  selectionIcon: { position: 'absolute', right: 10, top: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 9, marginTop: 24 },
  segment: { alignItems: 'center', borderRadius: 13, flex: 1, justifyContent: 'center', minHeight: 38 },
  segmentText: { fontSize: 13, fontWeight: '700' },
  segmentedControl: { borderRadius: 16, flexDirection: 'row', padding: 3 },
  settingLabel: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  supportIcon: { alignItems: 'center', borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  supportRow: { alignItems: 'center', borderRadius: 22, flexDirection: 'row', gap: 11, minHeight: 66, paddingHorizontal: 14, paddingVertical: 10 },
  supportTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  swatch: { borderColor: 'rgba(255,255,255,0.7)', borderRadius: 15, borderWidth: 2, height: 30, width: 30 },
  swatchOverlap: { marginLeft: -9 },
  swatchRow: { flexDirection: 'row' },
  timeField: { alignItems: 'center', flex: 1 },
  timeLabel: { fontSize: 17, fontWeight: '800' },
  timeLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginBottom: 5 },
  title: { fontSize: 36, fontWeight: '800', letterSpacing: 0.2, marginBottom: 22, marginTop: 62 },
});
