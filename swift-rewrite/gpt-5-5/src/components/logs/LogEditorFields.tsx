// ports: twilight/views/logs/sleepsessioneditorview.swift

import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { CardBackground, CircularTimePicker } from '@/components/common';
import { rgba } from '@/components/common/color';
import { Spacing } from '@/constants/theme';
import type { SleepSettings } from '@/domain/models';
import {
  buildSessionDatesFromEditor,
  dateKeyFromDate,
  type LogEditorDraft,
} from '@/domain/log-editor';
import { formatGoalMatch, makeDateInTimeZone } from '@/domain/session-rules';
import type { AppTheme } from '@/theme';

import { formatEditorClockTime, formatEditorDateLabel } from './log-editor-labels';

type LogEditorFieldsProps = {
  draft: LogEditorDraft;
  error: string | null;
  grayscale: boolean;
  mode: 'edit' | 'new';
  saving: boolean;
  settings: SleepSettings;
  theme: AppTheme;
  onCancel: () => void;
  onChange: (draft: LogEditorDraft) => void;
  onSave: () => void;
};

export function LogEditorFields({
  draft,
  error,
  grayscale,
  mode,
  onCancel,
  onChange,
  onSave,
  saving,
  settings,
  theme,
}: LogEditorFieldsProps) {
  const pickerDate = useMemo(() => makeDateInTimeZone(draft.wakeDayKey, 12, 0, draft.timeZone), [draft]);
  const sessionDates = useMemo(() => buildSessionDatesFromEditor(draft), [draft]);
  const goalMatch = useMemo(
    () =>
      formatGoalMatch({
        sleepDate: sessionDates.startTime,
        sleepTargetMinutes: settings.optimalSleepMinutes,
        timeZone: draft.timeZone,
        wakeDate: sessionDates.endTime,
        wakeTargetMinutes: settings.optimalWakeMinutes,
      }),
    [draft.timeZone, sessionDates, settings],
  );
  const scoreColor = goalMatch.score >= 85 ? theme.success : goalMatch.score >= 70 ? theme.actionPrimary : theme.warning;

  function setWakeDate(date: Date) {
    onChange({ ...draft, wakeDayKey: dateKeyFromDate(date, draft.timeZone) });
  }

  return (
    <>
      <EditorToolbar mode={mode} onCancel={onCancel} theme={theme} />

      <CardBackground theme={theme} style={styles.card}>
        <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>wake day</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateText}>
            <Text style={[styles.dateLabel, { color: theme.textPrimary }]}>
              {formatEditorDateLabel(draft.wakeDayKey, draft.timeZone)}
            </Text>
            <Text style={[styles.dateHint, { color: theme.textSecondary }]}>The day you woke up from this sleep.</Text>
          </View>
          <WakeDayPicker date={pickerDate} onChange={setWakeDate} theme={theme} timeZone={draft.timeZone} />
        </View>
      </CardBackground>

      <CardBackground active={goalMatch.score >= 85} theme={theme} style={styles.card}>
        <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>goal match</Text>
        <View style={styles.goalRow}>
          <Text style={[styles.score, { color: scoreColor }]}>{goalMatch.score}</Text>
          <View style={styles.goalCopy}>
            <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>{goalMatch.subtitle}</Text>
            <Text style={[styles.goalSubtitle, { color: theme.textSecondary }]}>
              Compared with {formatEditorClockTime(settings.optimalSleepMinutes)} bedtime and{' '}
              {formatEditorClockTime(settings.optimalWakeMinutes)} wake.
            </Text>
          </View>
        </View>
      </CardBackground>

      <CardBackground theme={theme} style={styles.card}>
        <View style={styles.sleepHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>sleep window</Text>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Drag the moon and sun</Text>
          </View>
        </View>

        <View style={styles.pickerFrame}>
          <CircularTimePicker
            grayscale={grayscale}
            onChange={(change) => onChange({ ...draft, ...change })}
            sleepMinutes={draft.sleepMinutes}
            theme={theme}
            wakeMinutes={draft.wakeMinutes}
          />
        </View>

        <View style={styles.timeGrid}>
          <TimeSummary label="Bedtime" minutes={draft.sleepMinutes} theme={theme} />
          <TimeSummary label="Wake up" minutes={draft.wakeMinutes} theme={theme} />
        </View>

        {error ? <Text style={[styles.errorText, { color: theme.warning }]}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={onSave}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.actionPrimary },
            pressed && styles.pressed,
            saving && styles.disabled,
          ]}>
          <Text style={styles.saveText}>{saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Sleep Log'}</Text>
        </Pressable>
      </CardBackground>
    </>
  );
}

function EditorToolbar({ mode, onCancel, theme }: { mode: 'edit' | 'new'; onCancel: () => void; theme: AppTheme }) {
  return (
    <View style={styles.toolbar}>
      <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelButton}>
        <Text style={[styles.cancelText, { color: theme.textPrimary }]}>Cancel</Text>
      </Pressable>
      <Text style={[styles.toolbarTitle, { color: theme.textPrimary }]}>{mode === 'edit' ? 'Edit Log' : 'Log Sleep'}</Text>
      <View style={styles.toolbarSpacer} />
    </View>
  );
}

function WakeDayPicker({
  date,
  onChange,
  theme,
  timeZone,
}: {
  date: Date;
  onChange: (date: Date) => void;
  theme: AppTheme;
  timeZone: string;
}) {
  if (Platform.OS === 'android') {
    return (
      <Pressable
        accessibilityLabel="change wake day"
        accessibilityRole="button"
        onPress={() =>
          DateTimePickerAndroid.open({
            mode: 'date',
            onValueChange: (_event, nextDate) => onChange(nextDate),
            timeZoneName: timeZone,
            value: date,
          })
        }
        style={({ pressed }) => [
          styles.dateButton,
          { backgroundColor: rgba(theme.textPrimary, 0.1), borderColor: rgba(theme.textPrimary, 0.16) },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.dateButtonText, { color: theme.textPrimary }]}>Change</Text>
      </Pressable>
    );
  }

  return (
    <DateTimePicker
      accentColor={theme.actionPrimary}
      display="compact"
      mode="date"
      onValueChange={(_event, nextDate) => onChange(nextDate)}
      themeVariant="dark"
      timeZoneName={timeZone}
      value={date}
    />
  );
}

function TimeSummary({ label, minutes, theme }: { label: string; minutes: number; theme: AppTheme }) {
  return (
    <View style={[styles.timeSummary, { backgroundColor: rgba(theme.textPrimary, 0.08) }]}>
      <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.timeValue, { color: theme.textPrimary }]}>{formatEditorClockTime(minutes)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  cancelButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '700',
  },
  toolbarTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  toolbarSpacer: {
    width: 74,
  },
  card: {
    marginHorizontal: 0,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  dateText: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  dateHint: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: Spacing.one,
  },
  dateButton: {
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 11,
  },
  dateButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  goalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  score: {
    fontSize: 54,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    letterSpacing: -1.6,
    lineHeight: 60,
  },
  goalCopy: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  goalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  sleepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: Spacing.one,
  },
  pickerFrame: {
    alignItems: 'center',
    marginVertical: Spacing.two,
  },
  timeGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  timeSummary: {
    borderRadius: 18,
    flex: 1,
    padding: Spacing.three,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: 24,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: Spacing.one,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: Spacing.three,
  },
  saveButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    marginTop: Spacing.four,
    paddingVertical: Spacing.three,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
