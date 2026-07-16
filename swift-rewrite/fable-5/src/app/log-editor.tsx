// ports: Views/Logs/SleepSessionEditorView.swift - the log sleep / edit log sheet
// wake-day pill + goal-match card, circular picker (size 220) with live sync,
// bedtime/wake summary cards, pinned save bar
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CircularTimePicker } from '@/components/common/CircularTimePicker';
import { Screen } from '@/components/common/Screen';
import {
  editorTimesFromSession,
  epochFromDayMinutes,
  resolveEditorDays,
} from '@/domain/editor';
import type { CalendarDay } from '@/domain/models';
import {
  averageGoalDeviationMinutes,
  goalMatchScore,
  goalMatchSubtitle,
  resolveEndTimeZone,
  zonedParts,
} from '@/domain/session-rules';
import { roundedFont } from '@/theme/fonts';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';
import { useSleepStore } from '@/state/app-sleep-store';
import { useSettings } from '@/state/settings-state';

const MOON_COLOR = '#7b68ee';
const SUN_COLOR = '#ffb347';

function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

function todayCalendarDay(): CalendarDay {
  const p = zonedParts(Date.now(), deviceTimeZone());
  return { year: p.year, month: p.month, day: p.day };
}

function clockLabel(minutes: number): string {
  const h = Math.trunc(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, '0')} ${ampm}`;
}

function dayLabel(day: CalendarDay): string {
  return new Date(Date.UTC(day.year, day.month - 1, day.day)).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function LogEditorScreen() {
  const theme = useTheme();
  const fixed = useFixedColor();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const sessions = useSleepStore((s) => s.sessions);
  const createManualLog = useSleepStore((s) => s.createManualLog);
  const updateSession = useSleepStore((s) => s.updateSession);

  const existing = useMemo(() => sessions.find((s) => s.id === id) ?? null, [sessions, id]);

  const initial = useMemo(() => {
    if (existing) return editorTimesFromSession(existing);
    return {
      wakeDay: todayCalendarDay(),
      sleepMinutes: useSettings.getState().optimalSleepMinutes,
      wakeMinutes: useSettings.getState().optimalWakeMinutes,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const [wakeDaySel, setWakeDaySel] = useState<CalendarDay>(initial.wakeDay);
  const [sleepMinutes, setSleepMinutes] = useState(initial.sleepMinutes);
  const [wakeMinutes, setWakeMinutes] = useState(initial.wakeMinutes);

  const optimalSleep = useSettings((s) => s.optimalSleepMinutes);
  const optimalWake = useSettings((s) => s.optimalWakeMinutes);
  const deviation = averageGoalDeviationMinutes(sleepMinutes, wakeMinutes, optimalSleep, optimalWake);
  const score = goalMatchScore(sleepMinutes, wakeMinutes, optimalSleep, optimalWake);
  const scoreColor =
    score >= 85 ? theme.success : score >= 70 ? theme.actionPrimary : theme.warning;

  const { sleepDay, wakeDayFinal } = resolveEditorDays(wakeDaySel, sleepMinutes, wakeMinutes);

  const save = () => {
    const startTz = existing?.startTimeZone ?? deviceTimeZone();
    const endTz = existing ? resolveEndTimeZone(existing) : startTz;
    const startTime = epochFromDayMinutes(sleepDay, sleepMinutes, startTz);
    const endTime = epochFromDayMinutes(wakeDayFinal, wakeMinutes, endTz);
    if (existing) {
      updateSession(existing.id, { startTime, endTime, startTimeZone: startTz, endTimeZone: endTz });
    } else {
      createManualLog({ startTime, endTime, startTimeZone: startTz, endTimeZone: endTz });
    }
    router.back();
  };

  return (
    <Screen starCount={28}>
      {/* inline-title toolbar over the gradient */}
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.cancel, { color: theme.accent }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {existing ? 'Edit Log' : 'Log Sleep'}
        </Text>
        <View style={styles.cancelSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* controls row: wake day + goal match */}
        <View style={styles.controlsRow}>
          <View style={[styles.compactPanel, { backgroundColor: theme.cardBackground, borderColor: hexOpacity(theme.actionPrimary, 0.22) }]}>
            <Text style={[styles.panelCaption, { color: theme.textSecondary }]}>Wake day</Text>
            <DateTimePicker
              value={new Date(wakeDaySel.year, wakeDaySel.month - 1, wakeDaySel.day, 12)}
              mode="date"
              display="compact"
              themeVariant={theme.name === 'sunset' ? 'light' : 'dark'}
              accentColor={theme.actionPrimary}
              onValueChange={(_, date) => {
                if (date) {
                  setWakeDaySel({
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                    day: date.getDate(),
                  });
                }
              }}
              style={styles.datePicker}
            />
          </View>
          <View style={[styles.compactPanel, { backgroundColor: theme.cardBackground, borderColor: hexOpacity(scoreColor, 0.22) }]}>
            <Text style={[styles.panelCaption, { color: theme.textSecondary }]}>Goal match</Text>
            <Text style={[styles.goalScore, roundedFont('700'), { color: theme.textPrimary }]}>
              {score}%
            </Text>
            <Text style={[styles.goalSubtitle, { color: scoreColor }]} numberOfLines={1}>
              {goalMatchSubtitle(deviation)}
            </Text>
          </View>
        </View>

        {/* schedule card */}
        <View style={[styles.scheduleCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.scheduleHeader}>
            <Text style={[styles.scheduleTitle, { color: theme.textPrimary }]}>Sleep window</Text>
            <Text style={[styles.scheduleHint, { color: theme.textSecondary }]}>
              Drag the moon and sun
            </Text>
          </View>
          <View style={styles.pickerWrap}>
            <CircularTimePicker
              size={220}
              sleepMinutes={sleepMinutes}
              wakeMinutes={wakeMinutes}
              onChange={(s, w) => {
                setSleepMinutes(s);
                setWakeMinutes(w);
              }}
            />
          </View>
          <View style={styles.timeCardsRow}>
            {(
              [
                ['moon.fill', fixed(MOON_COLOR), 'Bedtime', sleepMinutes, sleepDay],
                ['sun.max.fill', fixed(SUN_COLOR), 'Wake up', wakeMinutes, wakeDayFinal],
              ] as const
            ).map(([icon, color, label, minutes, day]) => (
              <View key={label} style={[styles.timeCard, { borderColor: hexOpacity(color, 0.22) }]}>
                <View style={styles.timeCardHeader}>
                  <SymbolView name={icon} size={12} weight="semibold" tintColor={color} />
                  <Text style={[styles.panelCaption, { color: theme.textSecondary }]}>{label}</Text>
                </View>
                <Text style={[styles.timeCardTime, roundedFont('600'), { color: theme.textPrimary }]}>
                  {clockLabel(minutes)}
                </Text>
                <Text style={[styles.timeCardDay, { color: theme.textSecondary }]}>
                  {dayLabel(day)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* pinned save bar */}
      <View style={styles.saveBar}>
        <Pressable
          testID="save-log"
          onPress={save}
          style={[styles.saveButton, { backgroundColor: theme.actionPrimary, shadowColor: theme.actionPrimary }]}>
          <Text style={styles.saveLabel}>{existing ? 'Save Changes' : 'Save Sleep Log'}</Text>
          <SymbolView name="arrow.right" size={15} weight="semibold" tintColor="#ffffff" />
        </Pressable>
      </View>
    </Screen>
  );
}

function hexOpacity(color: string, alpha: number): string {
  if (!color.startsWith('#')) return color;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  cancel: { fontSize: 17 },
  cancelSpacer: { width: 52 },
  title: { fontSize: 17, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120, gap: 16 },
  controlsRow: { flexDirection: 'row', gap: 12 },
  compactPanel: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  panelCaption: { fontSize: 12 },
  datePicker: { alignSelf: 'flex-start', marginLeft: -8 },
  goalScore: { fontSize: 17, fontVariant: ['tabular-nums'] },
  goalSubtitle: { fontSize: 12 },
  scheduleCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 18,
    gap: 14,
  },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleTitle: { fontSize: 17, fontWeight: '600' },
  scheduleHint: { fontSize: 12 },
  pickerWrap: { alignItems: 'center' },
  timeCardsRow: { flexDirection: 'row', gap: 14 },
  timeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  timeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeCardTime: { fontSize: 20 },
  timeCardDay: { fontSize: 11 },
  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 28,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  saveLabel: { fontSize: 17, fontWeight: '600', color: '#ffffff' },
});
