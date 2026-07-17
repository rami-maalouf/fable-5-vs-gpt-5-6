// ports: Views/BlockedProfileView.swift (the "Sleep Settings" form, sleep-core
// sections only): support row, sleep goal with native time pickers + goal
// pill, app appearance (display mode + theme color), notifications (wind-down
// toggle, routine link, live activity toggle), community links.
// NFC & QR / apple health / data sections are out of scope per the spec.
import { InlineDateTimePicker } from '@/components/common/InlineDateTimePicker';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  ActionSheetIOS,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Screen } from '@/components/common/Screen';
import type { ThemeMode, ThemePalette } from '@/domain/models';
import { useSettings } from '@/state/settings-state';
import { useFixedColor, useTheme, useThemeControls } from '@/theme/ThemeProvider';

const INDIGO = '#5856d6';
const ORANGE = '#ff9500';
const RED = '#ff3b30';

const MODE_LABELS: Record<ThemeMode, string> = {
  system: 'System',
  light: 'Sunset',
  dark: 'Night Sky',
};
const PALETTE_LABELS: Record<ThemePalette, string> = {
  twilight: 'Twilight (Blue/Teal)',
  amethyst: 'Amethyst (Purple/Blue)',
};

function goalLabel(sleepMinutes: number, wakeMinutes: number): string {
  let diff = wakeMinutes - sleepMinutes;
  if (diff < 0) diff += 24 * 60;
  const hours = Math.trunc(diff / 60);
  const minutes = diff % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

function minutesToDate(minutes: number): Date {
  return new Date(2000, 0, 1, Math.trunc(minutes / 60), minutes % 60);
}

function Row({
  children,
  rowBg,
  style,
}: {
  children: React.ReactNode;
  rowBg: string;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, { backgroundColor: rowBg }, style]}>{children}</View>;
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return <Text style={[styles.sectionHeader, { color }]}>{title.toUpperCase()}</Text>;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const fixed = useFixedColor();
  const { mode, palette, setMode, setPalette } = useThemeControls();
  const optimalSleepMinutes = useSettings((s) => s.optimalSleepMinutes);
  const optimalWakeMinutes = useSettings((s) => s.optimalWakeMinutes);
  const windDownEnabled = useSettings((s) => s.windDownReminderEnabled);
  const liveActivityEnabled = useSettings((s) => s.liveActivityEnabled);
  const setSetting = useSettings((s) => s.setSetting);

  const isLight = theme.name === 'sunset';
  const rowBg = isLight ? 'rgba(255, 255, 255, 0.75)' : '#1c1c1e';
  const pickerVariant = isLight ? ('light' as const) : ('dark' as const);

  const pickMode = () => {
    const options: ThemeMode[] = ['system', 'light', 'dark'];
    if (Platform.OS !== 'ios') {
      // android boot scope: cycle through modes instead of the ios action sheet
      setMode(options[(options.indexOf(mode) + 1) % options.length]);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...options.map((m) => MODE_LABELS[m]), 'Cancel'],
        cancelButtonIndex: 3,
        title: 'Display Mode',
      },
      (index) => {
        if (index < 3) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setMode(options[index]);
        }
      }
    );
  };

  const pickPalette = () => {
    const options: ThemePalette[] = ['twilight', 'amethyst'];
    if (Platform.OS !== 'ios') {
      setPalette(options[(options.indexOf(palette) + 1) % options.length]);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...options.map((p) => PALETTE_LABELS[p]), 'Cancel'],
        cancelButtonIndex: 2,
        title: 'Theme Color',
      },
      (index) => {
        if (index < 2) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setPalette(options[index]);
        }
      }
    );
  };

  const linkRow = (
    icon: SymbolViewProps['name'],
    label: string,
    url: string,
    isLast: boolean
  ) => (
    <Pressable key={label} onPress={() => Linking.openURL(url)}>
      <Row rowBg={rowBg} style={!isLast && styles.rowWithSeparator}>
        <SymbolView name={icon} size={22} tintColor={theme.textPrimary} />
        <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{label}</Text>
        <View style={styles.spacer} />
        <SymbolView name="arrow.up.right" size={12} tintColor="#98989f" />
      </Row>
    </Pressable>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Sleep Settings</Text>

        {/* support row */}
        <View style={styles.section}>
          <Row rowBg={rowBg}>
            <SymbolView name="heart.fill" size={20} tintColor={fixed(RED)} />
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Indie-built. Community-supported
            </Text>
            <View style={styles.spacer} />
            <SymbolView name="chevron.right" size={13} tintColor="#98989f" />
          </Row>
        </View>

        {/* sleep goal */}
        <View style={styles.section}>
          <SectionHeader title="Sleep Goal" color={theme.textSecondary} />
          <Row rowBg={rowBg} style={styles.goalRow}>
            <View style={styles.goalColumns}>
              <View style={styles.goalColumn}>
                <View style={styles.goalLabelRow}>
                  <SymbolView name="moon.fill" size={15} tintColor={fixed(INDIGO)} />
                  <Text style={[styles.goalLabel, { color: fixed(INDIGO) }]}>Bedtime</Text>
                </View>
                <InlineDateTimePicker
                  value={minutesToDate(optimalSleepMinutes)}
                  mode="time"
                  themeVariant={pickerVariant}
                  onValueChange={(date) => {
                    setSetting('optimalSleepMinutes', date.getHours() * 60 + date.getMinutes());
                  }}
                  style={styles.timePicker}
                />
              </View>
              <View style={styles.goalColumn}>
                <View style={styles.goalLabelRow}>
                  <SymbolView name="sun.max.fill" size={15} tintColor={fixed(ORANGE)} />
                  <Text style={[styles.goalLabel, { color: fixed(ORANGE) }]}>Wake Up</Text>
                </View>
                <InlineDateTimePicker
                  value={minutesToDate(optimalWakeMinutes)}
                  mode="time"
                  themeVariant={pickerVariant}
                  onValueChange={(date) => {
                    setSetting('optimalWakeMinutes', date.getHours() * 60 + date.getMinutes());
                  }}
                  style={styles.timePicker}
                />
              </View>
            </View>
            <View style={styles.goalPill}>
              <SymbolView name="clock" size={14} tintColor="#ffffff" />
              <Text style={styles.goalPillText}>
                Goal: {goalLabel(optimalSleepMinutes, optimalWakeMinutes)}
              </Text>
            </View>
          </Row>
        </View>

        {/* app appearance */}
        <View style={styles.section}>
          <SectionHeader title="App Appearance" color={theme.textSecondary} />
          <Pressable onPress={pickMode}>
            <Row rowBg={rowBg} style={styles.rowWithSeparator}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Display Mode</Text>
              <View style={styles.spacer} />
              <Text style={styles.rowValue}>{MODE_LABELS[mode]}</Text>
              <SymbolView name="chevron.up.chevron.down" size={12} tintColor="#98989f" />
            </Row>
          </Pressable>
          <Pressable onPress={pickPalette}>
            <Row rowBg={rowBg}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Theme Color</Text>
              <View style={styles.spacer} />
              <Text style={styles.rowValue}>{PALETTE_LABELS[palette]}</Text>
              <SymbolView name="chevron.up.chevron.down" size={12} tintColor="#98989f" />
            </Row>
          </Pressable>
        </View>

        {/* notifications */}
        <View style={styles.section}>
          <SectionHeader title="Notifications" color={theme.textSecondary} />
          <Row rowBg={rowBg} style={[styles.toggleRow, styles.rowWithSeparator]}>
            <View style={styles.toggleTexts}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                Wind-Down Reminder
              </Text>
              <Text style={styles.rowDescription}>
                Get reminded 3 hours before bedtime of optimal sleep habits like dimming the
                screen, using lamps, and eating and drinking
              </Text>
            </View>
            <Switch
              value={windDownEnabled}
              onValueChange={(v) => setSetting('windDownReminderEnabled', v)}
              trackColor={{ true: theme.actionPrimary }}
            />
          </Row>
          <Pressable onPress={() => router.push('/sleep-tips')} testID="sleep-tips-link">
            <Row rowBg={rowBg} style={styles.rowWithSeparator}>
              <Text style={[styles.routineLink, { color: theme.accent }]}>
                View wind-down routine
              </Text>
              <SymbolView name="arrow.right" size={12} tintColor={theme.accent} />
            </Row>
          </Pressable>
          <Row rowBg={rowBg} style={styles.toggleRow}>
            <View style={styles.toggleTexts}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Live Activity</Text>
              <Text style={styles.rowDescription}>
                Shows a live activity on your lock screen with some inspirational quote
              </Text>
            </View>
            <Switch
              value={liveActivityEnabled}
              onValueChange={(v) => setSetting('liveActivityEnabled', v)}
              trackColor={{ true: theme.actionPrimary }}
            />
          </Row>
        </View>

        {/* community */}
        <View style={styles.section}>
          <SectionHeader title="Community" color={theme.textSecondary} />
          {linkRow('bubble.left.and.bubble.right.fill', 'Join our Discord', 'https://discord.gg/9tj7J5MESv', false)}
          {linkRow('link', 'Follow us on LinkedIn', 'https://www.linkedin.com/company/orbitlabsdotstudio', false)}
          {linkRow('camera.fill', 'Follow us on Instagram', 'https://www.instagram.com/orbitlabs.studio', true)}
          <Text style={[styles.sectionFooter, { color: theme.textSecondary }]}>
            Would love to hear your feedback & suggestions!
          </Text>
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <SectionHeader title="Development" color={theme.textSecondary} />
            <Pressable
              testID="restart-onboarding"
              onPress={() => {
                setSetting('isOnboarded', false);
                router.push('/onboarding');
              }}>
              <Row rowBg={rowBg} style={styles.rowWithSeparator}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Restart Onboarding
                </Text>
              </Row>
            </Pressable>
            <Pressable
              testID="show-scheduled"
              onPress={async () => {
                const scheduled = await Notifications.getAllScheduledNotificationsAsync();
                Alert.alert(
                  `${scheduled.length} scheduled`,
                  scheduled
                    .map((n) => `${n.identifier}: ${JSON.stringify(n.trigger)}`)
                    .join('\n') || 'none'
                );
              }}>
              <Row rowBg={rowBg}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                  Show Scheduled Notifications
                </Text>
              </Row>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 70, paddingHorizontal: 16, paddingBottom: 120, gap: 22 },
  title: { fontSize: 34, fontWeight: '700' },
  section: { gap: 0 },
  sectionHeader: { fontSize: 13, marginBottom: 6, marginLeft: 16 },
  sectionFooter: { fontSize: 13, marginTop: 6, marginLeft: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  rowWithSeparator: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(84, 84, 88, 0.6)',
  },
  rowLabel: { fontSize: 17 },
  rowValue: { fontSize: 17, color: '#98989f' },
  rowDescription: { fontSize: 12, color: '#98989f', marginTop: 2 },
  spacer: { flex: 1 },
  goalRow: { flexDirection: 'column', alignItems: 'stretch', gap: 16, paddingVertical: 16 },
  goalColumns: { flexDirection: 'row', justifyContent: 'space-between' },
  goalColumn: { gap: 8, alignItems: 'flex-start' },
  goalLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalLabel: { fontSize: 17, fontWeight: '600' },
  timePicker: Platform.OS === 'ios' ? { marginLeft: -8 } : {},
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(38, 38, 38, 1)',
  },
  goalPillText: { fontSize: 15, fontWeight: '500', color: '#ffffff' },
  toggleRow: { alignItems: 'center' },
  toggleTexts: { flex: 1 },
  routineLink: { fontSize: 15 },
});
