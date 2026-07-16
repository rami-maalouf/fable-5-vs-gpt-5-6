import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CircularTimePicker,
  type CircularTimePickerValue,
} from '@/components/common/CircularTimePicker';
import { ScreenBackground } from '@/components/common/screen-background';
import {
  buildEditorTimestamps,
  createEditorValueFromSession,
  dayKeyFromPickerDate,
  pickerDateFromDayKey,
  type LogEditorValue,
} from '@/components/logs/log-editor-model';
import { getSessionRepository } from '@/data/session-repo';
import { settingsStore } from '@/data/settings-store';
import type { SleepSession } from '@/domain/models';
import {
  calculateGoalMatch,
  formatGoalMatchScore,
  formatGoalMatchSubtitle,
} from '@/domain/session-rules';
import { desaturateColor } from '@/theme/grayscale';
import { useTheme } from '@/theme/ThemeProvider';

interface GoalTimes {
  sleepMinutes: number;
  wakeMinutes: number;
}

const logEditorScreenOptions = {
  gestureEnabled: true,
  headerShown: false,
  presentation: 'modal',
} as const;

export default function LogEditorRoute() {
  const router = useRouter();
  const { sessionId: sessionIdParameter } = useLocalSearchParams<{
    sessionId?: string | string[];
  }>();
  const sessionId = Array.isArray(sessionIdParameter) ? sessionIdParameter[0] : sessionIdParameter;
  const { isSleeping, theme } = useTheme();
  const [editorValue, setEditorValue] = useState<LogEditorValue | null>(null);
  const [goalTimes, setGoalTimes] = useState<GoalTimes | null>(null);
  const [session, setSession] = useState<SleepSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const load = async () => {
      try {
        const [optimalSleepMinutes, optimalWakeMinutes] = await Promise.all([
          settingsStore.get('optimalSleepMinutes'),
          settingsStore.get('optimalWakeMinutes'),
        ]);
        const goals = {
          sleepMinutes: optimalSleepMinutes,
          wakeMinutes: optimalWakeMinutes,
        };
        let nextSession: SleepSession | null = null;
        let nextValue: LogEditorValue;
        if (sessionId) {
          const repository = await getSessionRepository();
          nextSession = await repository.getById(sessionId);
          if (!nextSession) {
            throw new Error('Sleep log not found');
          }
          nextValue = createEditorValueFromSession(nextSession);
        } else {
          nextValue = createNewEditorValue(goals);
        }
        if (isCurrent) {
          setGoalTimes(goals);
          setSession(nextSession);
          setEditorValue(nextValue);
        }
      } catch {
        if (isCurrent) {
          setError('Twilight could not load this sleep log.');
        }
      }
    };
    void load();
    return () => {
      isCurrent = false;
    };
  }, [sessionId]);

  const goalMatch = useMemo(() => {
    if (!editorValue || !goalTimes) {
      return null;
    }
    return calculateGoalMatch({
      sleepMinutes: editorValue.sleepMinutes,
      targetSleepMinutes: goalTimes.sleepMinutes,
      targetWakeMinutes: goalTimes.wakeMinutes,
      wakeMinutes: editorValue.wakeMinutes,
    });
  }, [editorValue, goalTimes]);

  const handlePickerChange = (value: CircularTimePickerValue) => {
    setEditorValue((current) => (current ? { ...current, ...value } : current));
  };

  const closeEditor = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/logs');
  };

  const save = async () => {
    if (!editorValue || isSaving) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const timestamps = buildEditorTimestamps(editorValue);
      const repository = await getSessionRepository();
      if (session) {
        await repository.update({
          ...session,
          ...timestamps,
          endTimeZone: editorValue.endTimeZone,
          startTimeZone: editorValue.startTimeZone,
        });
      } else {
        await repository.createCompleted({
          ...timestamps,
          endTimeZone: editorValue.endTimeZone,
          startTimeZone: editorValue.startTimeZone,
          tag: 'Manual Log',
        });
      }
      closeEditor();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Twilight could not save this log.');
    } finally {
      setIsSaving(false);
    }
  };

  const sleepColor = isSleeping ? desaturateColor('#7b68ee') : '#7b68ee';
  const wakeColor = isSleeping ? desaturateColor('#ffb347') : '#ffb347';

  return (
    <ScreenBackground>
      <Stack.Screen options={logEditorScreenOptions} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.toolbar}>
          <Pressable accessibilityRole="button" onPress={closeEditor} style={styles.toolbarAction}>
            <Text style={[styles.cancel, { color: theme.accent }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.toolbarTitle, { color: theme.textPrimary }]}>
            {sessionId ? 'Edit Sleep' : 'Log Sleep'}
          </Text>
          <View style={styles.toolbarAction} />
        </View>

        {!editorValue || !goalMatch ? (
          <View style={styles.loadingState}>
            {error ? (
              <Text style={[styles.errorText, { color: theme.warning }]}>{error}</Text>
            ) : (
              <ActivityIndicator color={theme.accent} size="large" />
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.metaRow}>
              <View style={[styles.metaCard, { backgroundColor: theme.cardBackground, borderColor: theme.accent }]}>
                <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Wake day</Text>
                <DateTimePicker
                  accentColor={theme.accent}
                  display="compact"
                  maximumDate={new Date()}
                  mode="date"
                  onValueChange={(_event, date) => {
                    if (date) {
                      setEditorValue((current) =>
                        current ? { ...current, wakeDayKey: dayKeyFromPickerDate(date) } : current,
                      );
                    }
                  }}
                  themeVariant={theme.colorScheme}
                  value={pickerDateFromDayKey(editorValue.wakeDayKey)}
                />
              </View>
              <View style={[styles.metaCard, { backgroundColor: theme.cardBackground, borderColor: theme.success }]}>
                <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Goal match</Text>
                <Text style={[styles.goalScore, { color: theme.textPrimary }]}>
                  {formatGoalMatchScore(goalMatch.score)}
                </Text>
                <Text style={[styles.goalSubtitle, { color: theme.success }]}>
                  {formatGoalMatchSubtitle(goalMatch.averageDeviationMinutes)}
                </Text>
              </View>
            </View>

            <View style={[styles.windowCard, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.windowHeading}>
                <Text style={[styles.windowTitle, { color: theme.textPrimary }]}>Sleep window</Text>
                <Text style={[styles.windowHint, { color: theme.textSecondary }]}>Drag the moon and sun</Text>
              </View>
              <View style={styles.pickerFrame}>
                <CircularTimePicker
                  onChange={handlePickerChange}
                  sleepMinutes={editorValue.sleepMinutes}
                  wakeMinutes={editorValue.wakeMinutes}
                />
              </View>
              <View style={styles.timeRow}>
                <TimeSummary color={sleepColor} icon="moon.fill" label="Bedtime" minutes={editorValue.sleepMinutes} />
                <TimeSummary color={wakeColor} icon="sun.max.fill" label="Wake up" minutes={editorValue.wakeMinutes} />
              </View>
            </View>

            {error ? (
              <Text accessibilityRole="alert" style={[styles.saveError, { color: theme.warning }]}>{error}</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: isSaving, disabled: isSaving }}
              disabled={isSaving}
              onPress={() => void save()}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: theme.actionPrimary, opacity: isSaving ? 0.55 : pressed ? 0.8 : 1 },
              ]}
              testID="save-sleep-log"
            >
              <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Sleep Log'}</Text>
              <SymbolView name="arrow.right" size={19} tintColor="#ffffff" />
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

function TimeSummary({
  color,
  icon,
  label,
  minutes,
}: {
  color: string;
  icon: 'moon.fill' | 'sun.max.fill';
  label: string;
  minutes: number;
}) {
  return (
    <View style={[styles.timeCard, { borderColor: color }]}>
      <View style={styles.timeLabelRow}>
        <SymbolView name={icon} size={16} tintColor={color} />
        <Text style={[styles.timeLabel, { color }]}>{label}</Text>
      </View>
      <Text style={styles.timeValue}>{formatClock(minutes)}</Text>
    </View>
  );
}

function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function createNewEditorValue(goals: GoalTimes): LogEditorValue {
  const timeZone = currentTimeZone();
  return {
    endTimeZone: timeZone,
    sleepMinutes: goals.sleepMinutes,
    startTimeZone: timeZone,
    wakeDayKey: dayKeyFromPickerDate(new Date()),
    wakeMinutes: goals.wakeMinutes,
  };
}

function formatClock(minutes: number): string {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  return `${hour % 12 || 12}:${String(normalized % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

const styles = StyleSheet.create({
  cancel: { fontSize: 16, fontWeight: '700' },
  content: { paddingBottom: 30, paddingTop: 18 },
  errorText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  goalScore: { fontSize: 27, fontWeight: '800', marginTop: 8 },
  goalSubtitle: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  loadingState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 36 },
  metaCard: { borderRadius: 20, borderWidth: 1, flex: 1, minHeight: 112, padding: 14 },
  metaLabel: { fontSize: 13, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  pickerFrame: { alignItems: 'center', height: 360 },
  safeArea: { flex: 1 },
  saveButton: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginHorizontal: 18,
    marginTop: 18,
    minHeight: 58,
  },
  saveError: { fontSize: 13, fontWeight: '600', marginHorizontal: 24, marginTop: 14, textAlign: 'center' },
  saveText: { color: '#ffffff', fontSize: 19, fontWeight: '800' },
  timeCard: { borderRadius: 16, borderWidth: 1, flex: 1, padding: 13 },
  timeLabel: { fontSize: 13, fontWeight: '700' },
  timeLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  timeRow: { flexDirection: 'row', gap: 10, paddingBottom: 16, paddingHorizontal: 16 },
  timeValue: { color: '#ffffff', fontSize: 19, fontVariant: ['tabular-nums'], fontWeight: '800', marginTop: 8 },
  toolbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 7 },
  toolbarAction: { minWidth: 58 },
  toolbarTitle: { fontSize: 18, fontWeight: '800' },
  windowCard: { borderColor: 'rgba(142,142,147,0.30)', borderRadius: 26, borderWidth: 1, marginHorizontal: 14, marginTop: 16, overflow: 'hidden' },
  windowHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 17 },
  windowHint: { fontSize: 13 },
  windowTitle: { fontSize: 21, fontWeight: '800' },
});
