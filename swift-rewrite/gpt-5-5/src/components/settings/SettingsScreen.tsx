import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { CardBackground, ScreenChrome } from '@/components/common';
import { rgba } from '@/components/common/color';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import type { SleepSettings, ThemeMode, ThemePalette } from '@/domain/models';
import type { AppTheme } from '@/theme';
import {
  useSleepAppearanceTheme,
  useSleepSettings,
  useUpdateSleepSettings,
} from '@/theme/sleep-appearance';

import {
  formatGoalDurationLabel,
  formatSettingsClockTime,
  updateSleepGoal,
} from './settings-model';

const modeOptions: { label: string; value: ThemeMode; description: string }[] = [
  { label: 'System', value: 'system', description: 'Follow iOS appearance.' },
  { label: 'Sunset', value: 'light', description: 'Warm light theme.' },
  { label: 'Night', value: 'dark', description: 'Use the selected night palette.' },
];

const paletteOptions: { label: string; value: ThemePalette; description: string }[] = [
  { label: 'Twilight', value: 'twilight', description: 'Teal night palette.' },
  { label: 'Amethyst', value: 'amethyst', description: 'Purple night palette.' },
];

function dateFromMinutes(minutes: number) {
  const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return date;
}

function minutesFromDate(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function SettingsHeader({ theme }: { theme: AppTheme }) {
  return (
    <CardBackground theme={theme} recipe="large" style={styles.card}>
      <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>preferences</Text>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Sleep Settings</Text>
      <View style={[styles.supportRow, { borderColor: rgba(theme.textPrimary, 0.12), backgroundColor: rgba(theme.textPrimary, 0.06) }]}>
        <Text style={[styles.supportTitle, { color: theme.textPrimary }]}>Indie-built. Community-supported.</Text>
        <Text style={[styles.supportBody, { color: theme.textSecondary }]}>
          Twilight keeps the port focused on sleep and wake times, not surveillance.
        </Text>
      </View>
    </CardBackground>
  );
}

function TimePickerPill({
  label,
  minutes,
  onChange,
  theme,
}: {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
  theme: AppTheme;
}) {
  const date = dateFromMinutes(minutes);

  if (Platform.OS === 'android') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`change ${label.toLowerCase()}`}
        onPress={() =>
          DateTimePickerAndroid.open({
            mode: 'time',
            onValueChange: (_event, nextDate) => {
              if (nextDate) {
                onChange(minutesFromDate(nextDate));
              }
            },
            value: date,
          })
        }
        style={({ pressed }) => [
          styles.timePill,
          { backgroundColor: rgba(theme.textPrimary, 0.08), borderColor: rgba(theme.textPrimary, 0.14) },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.timeValue, { color: theme.textPrimary }]}>{formatSettingsClockTime(minutes)}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.timePill, { backgroundColor: rgba(theme.textPrimary, 0.08), borderColor: rgba(theme.textPrimary, 0.14) }]}>
      <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>{label}</Text>
      <DateTimePicker
        accentColor={theme.actionPrimary}
        display="compact"
        mode="time"
        onValueChange={(_event, nextDate) => {
          if (nextDate) {
            onChange(minutesFromDate(nextDate));
          }
        }}
        themeVariant={theme.id === 'sunset' ? 'light' : 'dark'}
        value={date}
      />
    </View>
  );
}

function SleepGoalCard({
  onUpdate,
  settings,
  theme,
}: {
  onUpdate: (patch: Partial<SleepSettings>) => void;
  settings: SleepSettings;
  theme: AppTheme;
}) {
  function updateGoal(patch: { sleepMinutes?: number; wakeMinutes?: number }) {
    const next = updateSleepGoal(settings, {
      sleepMinutes: patch.sleepMinutes ?? settings.optimalSleepMinutes,
      wakeMinutes: patch.wakeMinutes ?? settings.optimalWakeMinutes,
    });

    onUpdate({
      optimalSleepMinutes: next.optimalSleepMinutes,
      optimalWakeMinutes: next.optimalWakeMinutes,
    });
  }

  return (
    <CardBackground theme={theme} style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>sleep goal</Text>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Your ideal window</Text>
        </View>
        <View style={[styles.goalChip, { backgroundColor: rgba(theme.actionPrimary, 0.18), borderColor: rgba(theme.actionPrimary, 0.36) }]}>
          <Text style={[styles.goalChipText, { color: theme.textPrimary }]}>
            {formatGoalDurationLabel(settings.optimalSleepMinutes, settings.optimalWakeMinutes)}
          </Text>
        </View>
      </View>
      <View style={styles.timeGrid}>
        <TimePickerPill
          label="Bedtime"
          minutes={settings.optimalSleepMinutes}
          onChange={(minutes) => updateGoal({ sleepMinutes: minutes })}
          theme={theme}
        />
        <TimePickerPill
          label="Wake"
          minutes={settings.optimalWakeMinutes}
          onChange={(minutes) => updateGoal({ wakeMinutes: minutes })}
          theme={theme}
        />
      </View>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Dashboard metrics, the editor goal-match score, and future wind-down reminders use these times.
      </Text>
    </CardBackground>
  );
}

function OptionButton<T extends string>({
  description,
  label,
  onPress,
  selected,
  theme,
}: {
  description: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  theme: AppTheme;
  value: T;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionButton,
        {
          backgroundColor: selected ? rgba(theme.actionPrimary, 0.22) : rgba(theme.textPrimary, 0.06),
          borderColor: selected ? rgba(theme.actionPrimary, 0.48) : rgba(theme.textPrimary, 0.12),
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>{label}</Text>
      <Text style={[styles.optionBody, { color: theme.textSecondary }]}>{description}</Text>
    </Pressable>
  );
}

function AppearanceCard({
  onUpdate,
  settings,
  theme,
}: {
  onUpdate: (patch: Partial<SleepSettings>) => void;
  settings: SleepSettings;
  theme: AppTheme;
}) {
  return (
    <CardBackground theme={theme} style={styles.card}>
      <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>app appearance</Text>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Display Mode</Text>
      <View style={styles.optionGrid}>
        {modeOptions.map((option) => (
          <OptionButton
            description={option.description}
            key={option.value}
            label={option.label}
            onPress={() => onUpdate({ themeMode: option.value })}
            selected={settings.themeMode === option.value}
            theme={theme}
            value={option.value}
          />
        ))}
      </View>
      <Text style={[styles.cardTitle, styles.subsectionTitle, { color: theme.textPrimary }]}>Theme Color</Text>
      <View style={styles.optionGrid}>
        {paletteOptions.map((option) => (
          <OptionButton
            description={option.description}
            key={option.value}
            label={option.label}
            onPress={() => onUpdate({ themePalette: option.value })}
            selected={settings.themePalette === option.value}
            theme={theme}
            value={option.value}
          />
        ))}
      </View>
    </CardBackground>
  );
}

function WindDownCard({
  onUpdate,
  settings,
  theme,
}: {
  onUpdate: (patch: Partial<SleepSettings>) => void;
  settings: SleepSettings;
  theme: AppTheme;
}) {
  return (
    <CardBackground active={settings.windDownEnabled} theme={theme} style={styles.card}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>wind-down reminder</Text>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Prepare for rest</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            A daily reminder can be scheduled three hours before bedtime and rescheduled when your goal changes.
          </Text>
        </View>
        <Switch
          accessibilityLabel="toggle wind-down reminder"
          onValueChange={(windDownEnabled) => onUpdate({ windDownEnabled })}
          thumbColor={settings.windDownEnabled ? theme.textPrimary : theme.textSecondary}
          trackColor={{ false: rgba(theme.textPrimary, 0.18), true: rgba(theme.actionPrimary, 0.64) }}
          value={settings.windDownEnabled}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/sleep-tips')}
        style={({ pressed }) => [
          styles.linkRow,
          { borderColor: rgba(theme.textPrimary, 0.12), backgroundColor: rgba(theme.textPrimary, 0.06) },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.linkTitle, { color: theme.textPrimary }]}>Sleep hygiene tips</Text>
        <Text style={[styles.linkArrow, { color: theme.textSecondary }]}>›</Text>
      </Pressable>
    </CardBackground>
  );
}

function LiveActivityCard({
  onUpdate,
  settings,
  theme,
}: {
  onUpdate: (patch: Partial<SleepSettings>) => void;
  settings: SleepSettings;
  theme: AppTheme;
}) {
  return (
    <CardBackground active={settings.liveActivityEnabled} theme={theme} style={styles.card}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>live activity</Text>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Lock screen sleep progress</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Show elapsed sleep, remaining goal time, and the wake action while sleep mode is active.
          </Text>
        </View>
        <Switch
          accessibilityLabel="toggle live activity"
          onValueChange={(liveActivityEnabled) => onUpdate({ liveActivityEnabled })}
          thumbColor={settings.liveActivityEnabled ? theme.textPrimary : theme.textSecondary}
          trackColor={{ false: rgba(theme.textPrimary, 0.18), true: rgba(theme.actionPrimary, 0.64) }}
          value={settings.liveActivityEnabled}
        />
      </View>
    </CardBackground>
  );
}

function CommunityCard({ theme }: { theme: AppTheme }) {
  const updateSettings = useUpdateSleepSettings();

  return (
    <CardBackground theme={theme} style={styles.card}>
      <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>community</Text>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Built with care</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The original shortcuts section is out of scope for this port. Community support remains in scope.
      </Text>
      <View style={styles.communityGrid}>
        <View style={[styles.communityPill, { backgroundColor: rgba(theme.textPrimary, 0.07), borderColor: rgba(theme.textPrimary, 0.12) }]}>
          <Text style={[styles.communityTitle, { color: theme.textPrimary }]}>Share feedback</Text>
          <Text style={[styles.optionBody, { color: theme.textSecondary }]}>Help shape the port.</Text>
        </View>
        <View style={[styles.communityPill, { backgroundColor: rgba(theme.textPrimary, 0.07), borderColor: rgba(theme.textPrimary, 0.12) }]}>
          <Text style={[styles.communityTitle, { color: theme.textPrimary }]}>Community updates</Text>
          <Text style={[styles.optionBody, { color: theme.textSecondary }]}>Follow progress.</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void updateSettings({ isOnboarded: false });
          router.replace('/onboarding');
        }}
        style={({ pressed }) => [
          styles.restartRow,
          { borderColor: rgba(theme.textPrimary, 0.12), backgroundColor: rgba(theme.textPrimary, 0.06) },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.linkTitle, { color: theme.textPrimary }]}>Restart onboarding</Text>
        <Text style={[styles.optionBody, { color: theme.textSecondary }]}>Dev reset path</Text>
      </Pressable>
    </CardBackground>
  );
}

export function SettingsScreen() {
  const theme = useSleepAppearanceTheme();
  const settings = useSleepSettings();
  const updateSettings = useUpdateSleepSettings();

  function onUpdate(patch: Partial<SleepSettings>) {
    void updateSettings(patch);
  }

  return (
    <ScreenChrome theme={theme}>
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsHeader theme={theme} />
        <SleepGoalCard onUpdate={onUpdate} settings={settings} theme={theme} />
        <AppearanceCard onUpdate={onUpdate} settings={settings} theme={theme} />
        <WindDownCard onUpdate={onUpdate} settings={settings} theme={theme} />
        <LiveActivityCard onUpdate={onUpdate} settings={settings} theme={theme} />
        <CommunityCard theme={theme} />
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    marginTop: Spacing.two,
  },
  card: {
    marginHorizontal: Spacing.two,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 29,
    marginTop: Spacing.one,
  },
  communityGrid: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  communityPill: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three,
  },
  communityTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset + Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    width: '100%',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  goalChip: {
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  goalChipText: {
    fontSize: 13,
    fontWeight: '900',
  },
  linkArrow: {
    fontSize: 26,
    fontWeight: '700',
  },
  linkRow: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  optionBody: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: Spacing.half,
  },
  optionButton: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minWidth: 96,
    padding: Spacing.three,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  restartRow: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: Spacing.two,
    padding: Spacing.three,
  },
  subsectionTitle: {
    marginTop: Spacing.four,
  },
  supportBody: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: Spacing.one,
  },
  supportRow: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  timeGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  timePill: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: Spacing.one,
    minHeight: 88,
    padding: Spacing.three,
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.4,
    lineHeight: 48,
    marginTop: Spacing.one,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
});
