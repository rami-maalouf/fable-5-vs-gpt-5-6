import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { CardBackground, ScreenChrome } from '@/components/common';
import { rgba } from '@/components/common/color';
import { AlignmentScoreCard, MovingAverageCard } from '@/components/charts/DashboardMetricCards';
import { WeekChart } from '@/components/charts/WeekChart';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { settingsStore } from '@/data/settings-store';
import { getSessionRepository } from '@/data/session-store';
import { defaultSleepSettings, type SleepSettings, type SleepSession } from '@/domain/models';
import {
  getGreeting,
  getShuffledGreeting,
  greetingBanks,
  minutesSinceMidnight,
  selectGreetingBank,
} from '@/copy/greetings';
import type { AppTheme } from '@/theme';
import { useSleepAppearanceTheme } from '@/theme/sleep-appearance';

import { SleepToggleCard } from './SleepToggleCard';
import {
  buildDashboardSummary,
  formatChangePercent,
  formatClockMinutes,
  formatDurationHours,
  formatScore,
  type DashboardRange,
  type DashboardSummary,
} from './dashboard-summary';

type DashboardMode = 'Week' | '7-Night Avg' | 'Score' | 'Core';

type DashboardData = {
  activeSession: SleepSession | null;
  error: string | null;
  loading: boolean;
  sessions: SleepSession[];
  settings: SleepSettings;
};

const dashboardModes: DashboardMode[] = ['Week', '7-Night Avg', 'Score', 'Core'];
const dashboardRanges: DashboardRange[] = ['90D', 'All'];

function formatDateLine(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(date);
}

function FadeInSlide({
  children,
  delay = 0,
  style,
}: PropsWithChildren<{
  delay?: number;
  style?: StyleProp<ViewStyle>;
}>) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(progress, {
      damping: 6,
      delay,
      mass: 1,
      stiffness: 100,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}

function LoadingCard({ summary, theme }: { summary: DashboardSummary; theme: AppTheme }) {
  return (
    <CardBackground theme={theme} style={styles.card}>
      <Text style={[styles.cardEyebrow, { color: theme.textSecondary }]}>loading</Text>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>syncing dashboard</Text>
      <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
        {summary.rangeRecords.length > 0 ? 'Refreshing the latest sleep state.' : 'Preparing your first dashboard.'}
      </Text>
    </CardBackground>
  );
}

function HeaderCard({
  dateLine,
  greeting,
  onInfoPress,
  onShuffleGreeting,
  theme,
}: {
  dateLine: string;
  greeting: string;
  onInfoPress: () => void;
  onShuffleGreeting: () => void;
  theme: AppTheme;
}) {
  return (
    <CardBackground theme={theme} recipe="large" style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Shuffle greeting"
          onPress={onShuffleGreeting}
          style={({ pressed }) => [styles.greetingButton, pressed && styles.pressed]}>
          <Text style={[styles.greeting, { color: theme.textPrimary }]}>{greeting}</Text>
          <Text style={[styles.dateLine, { color: theme.textSecondary }]}>{dateLine}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open metrics explanation"
          onPress={onInfoPress}
          style={({ pressed }) => [
            styles.infoButton,
            { borderColor: rgba(theme.textPrimary, 0.18), backgroundColor: rgba(theme.textPrimary, 0.08) },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.infoText, { color: theme.textPrimary }]}>i</Text>
        </Pressable>
      </View>
    </CardBackground>
  );
}

function SegmentedPicker({
  mode,
  onModeChange,
  range,
  onRangeChange,
  theme,
}: {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  range: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;
  theme: AppTheme;
}) {
  return (
    <CardBackground theme={theme} style={styles.card}>
      <Text style={[styles.cardEyebrow, { color: theme.textSecondary }]}>view mode</Text>
      <View style={[styles.segmentRow, { backgroundColor: rgba(theme.textPrimary, 0.06) }]}>
        {dashboardModes.map((candidate) => {
          const selected = candidate === mode;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={candidate}
              onPress={() => onModeChange(candidate)}
              style={[
                styles.segment,
                selected && { backgroundColor: rgba(theme.actionPrimary, 0.92) },
              ]}>
              <Text style={[styles.segmentText, { color: selected ? '#ffffff' : theme.textSecondary }]}>{candidate}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.rangeRow}>
        {dashboardRanges.map((candidate) => {
          const selected = candidate === range;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={candidate}
              onPress={() => onRangeChange(candidate)}
              style={[
                styles.rangeButton,
                { borderColor: rgba(theme.textPrimary, selected ? 0.32 : 0.14) },
                selected && { backgroundColor: rgba(theme.accent, 0.18) },
              ]}>
              <Text style={[styles.rangeText, { color: selected ? theme.textPrimary : theme.textSecondary }]}>{candidate}</Text>
            </Pressable>
          );
        })}
      </View>
    </CardBackground>
  );
}

function MetricPill({ label, theme, value }: { label: string; theme: AppTheme; value: string }) {
  return (
    <View style={[styles.metricPill, { borderColor: rgba(theme.textPrimary, 0.14), backgroundColor: rgba(theme.textPrimary, 0.06) }]}>
      <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function LastNightCard({ summary, theme }: { summary: DashboardSummary; theme: AppTheme }) {
  const lastNight = summary.lastNight;

  return (
    <CardBackground active={summary.streakDays > 0} theme={theme} style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={[styles.cardEyebrow, { color: theme.textSecondary }]}>last night</Text>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>status</Text>
        </View>
        <View style={[styles.streakPill, { backgroundColor: rgba(theme.success, 0.18), borderColor: rgba(theme.success, 0.34) }]}>
          <Text style={[styles.streakText, { color: theme.success }]}>{summary.streakDays} day streak</Text>
        </View>
      </View>
      {lastNight ? (
        <View style={styles.lastNightGrid}>
          <View>
            <Text style={[styles.duration34, { color: theme.textPrimary }]}>{formatDurationHours(lastNight.durationHours)}</Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{formatChangePercent(summary.dayOverDayPercent)}</Text>
          </View>
          <View style={styles.lastNightDetails}>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>bed offset {lastNight.bedtimeOffsetHours.toFixed(1)}h</Text>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>wake offset {lastNight.wakeOffsetHours.toFixed(1)}h</Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          No nights yet. Start sleep mode tonight and this card will track your latest valid session.
        </Text>
      )}
    </CardBackground>
  );
}

function ModeCard({
  mode,
  settings,
  summary,
  theme,
}: {
  mode: DashboardMode;
  settings: SleepSettings;
  summary: DashboardSummary;
  theme: AppTheme;
}) {
  const titleByMode: Record<DashboardMode, string> = {
    '7-Night Avg': 'seven-night average',
    Core: 'core signals',
    Score: 'alignment score',
    Week: 'week overview',
  };
  const subtitleByMode: Record<DashboardMode, string> = {
    '7-Night Avg': 'Rolling average chart arrives in task 18. The current number already uses the metric engine.',
    Core: 'Duration, consistency, schedule accuracy, and coverage are computed now from valid sessions.',
    Score: 'The score uses the weighted alignment model from the advanced metrics task.',
    Week: 'Weekly bar chart arrives in task 18. These cards summarize the active range now.',
  };

  return (
    <CardBackground theme={theme} style={styles.card}>
      <Text style={[styles.cardEyebrow, { color: theme.textSecondary }]}>{summary.range} range</Text>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{titleByMode[mode]}</Text>
      <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{subtitleByMode[mode]}</Text>
      <View style={styles.metricGrid}>
        {mode === 'Score' ? (
          <>
            <MetricPill label="score" theme={theme} value={formatScore(summary.alignmentScore)} />
            <MetricPill label="goal hit" theme={theme} value={`${summary.goalHitRatePercent}%`} />
            <MetricPill label="trend" theme={theme} value={summary.trendPercent == null ? '--' : `${summary.trendPercent}%`} />
          </>
        ) : mode === '7-Night Avg' ? (
          <>
            <MetricPill label="rolling avg" theme={theme} value={formatDurationHours(summary.movingAverageHours)} />
            <MetricPill label="range avg" theme={theme} value={formatDurationHours(summary.averageDurationHours)} />
            <MetricPill label="target" theme={theme} value={formatDurationHours(summary.targetDurationHours)} />
          </>
        ) : mode === 'Core' ? (
          <>
            <MetricPill label="regularity" theme={theme} value={`${summary.sleepRegularity}`} />
            <MetricPill label="schedule" theme={theme} value={`${summary.scheduleAccuracy}`} />
            <MetricPill label="coverage" theme={theme} value={`${summary.coveragePercent}%`} />
          </>
        ) : (
          <>
            <MetricPill label="nights" theme={theme} value={`${summary.rangeRecords.length}`} />
            <MetricPill label="avg duration" theme={theme} value={formatDurationHours(summary.averageDurationHours)} />
            <MetricPill label="target wake" theme={theme} value={formatClockMinutes(settings.optimalWakeMinutes)} />
          </>
        )}
      </View>
    </CardBackground>
  );
}

function MetricsExplanationSheet({
  onClose,
  theme,
  visible,
}: {
  onClose: () => void;
  theme: AppTheme;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close metrics explanation" onPress={onClose} style={styles.modalOverlay} />
        <View style={[styles.sheet, { backgroundColor: rgba('#07111c', 0.98), borderColor: rgba(theme.textPrimary, 0.16) }]}>
          <View style={[styles.dragIndicator, { backgroundColor: rgba(theme.textPrimary, 0.34) }]} />
          <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>how dashboard metrics work</Text>
          <Text style={[styles.sheetText, { color: theme.textSecondary }]}>
            Last-night status uses the newest valid sleep session. Day-to-day change compares duration against the prior valid night.
          </Text>
          <Text style={[styles.sheetText, { color: theme.textSecondary }]}>
            Streak counts consecutive wake days with tracked sessions. Score, regularity, schedule accuracy, and goal hit rate come from the shared
            metrics engine used by the insights tab.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.sheetButton, { backgroundColor: theme.actionPrimary }, pressed && styles.pressed]}>
            <Text style={styles.sheetButtonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function DashboardScreen() {
  const theme = useSleepAppearanceTheme();
  const [mode, setMode] = useState<DashboardMode>('Week');
  const [range, setRange] = useState<DashboardRange>('90D');
  const [now, setNow] = useState(() => new Date());
  const [infoVisible, setInfoVisible] = useState(false);
  const [greeting, setGreeting] = useState(() =>
    getGreeting({
      currentMinutes: minutesSinceMidnight(new Date()),
      sleepMinutes: defaultSleepSettings.optimalSleepMinutes,
      wakeMinutes: defaultSleepSettings.optimalWakeMinutes,
    }),
  );
  const [data, setData] = useState<DashboardData>({
    activeSession: null,
    error: null,
    loading: true,
    sessions: [],
    settings: defaultSleepSettings,
  });

  const refreshDashboard = useCallback(async () => {
    setData((current) => ({ ...current, loading: true }));

    try {
      const [repository, settings] = await Promise.all([getSessionRepository(), settingsStore.getSettings()]);
      const [sessions, activeSession] = await Promise.all([repository.listValidSessions(), repository.getActiveSession()]);

      setData({
        activeSession,
        error: null,
        loading: false,
        sessions,
        settings,
      });
    } catch (error) {
      setData((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to load dashboard.',
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const greetingInput = useMemo(
    () => ({
      currentMinutes: minutesSinceMidnight(now),
      isSleeping: Boolean(data.activeSession),
      sleepMinutes: data.settings.optimalSleepMinutes,
      wakeMinutes: data.settings.optimalWakeMinutes,
    }),
    [data.activeSession, data.settings.optimalSleepMinutes, data.settings.optimalWakeMinutes, now],
  );
  const greetingBank = useMemo(() => selectGreetingBank(greetingInput), [greetingInput]);

  useEffect(() => {
    setGreeting((current) => (greetingBanks[greetingBank].includes(current) ? current : greetingBanks[greetingBank][0]));
  }, [greetingBank]);

  const summary = useMemo(
    () =>
      buildDashboardSummary({
        range,
        referenceDate: now,
        sessions: data.sessions,
        settings: data.settings,
      }),
    [data.sessions, data.settings, now, range],
  );

  const shuffleGreeting = useCallback(() => {
    setGreeting((current) => getShuffledGreeting(current, greetingInput));
  }, [greetingInput]);

  return (
    <ScreenChrome theme={theme}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInSlide>
          <HeaderCard
            dateLine={formatDateLine(now)}
            greeting={greeting}
            onInfoPress={() => setInfoVisible(true)}
            onShuffleGreeting={shuffleGreeting}
            theme={theme}
          />
        </FadeInSlide>
        <FadeInSlide delay={60}>
          <SegmentedPicker mode={mode} onModeChange={setMode} onRangeChange={setRange} range={range} theme={theme} />
        </FadeInSlide>
        {data.error ? (
          <FadeInSlide delay={100}>
            <CardBackground theme={theme} style={styles.card}>
              <Text style={[styles.cardTitle, { color: theme.warning }]}>dashboard unavailable</Text>
              <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{data.error}</Text>
            </CardBackground>
          </FadeInSlide>
        ) : null}
        {data.loading ? (
          <FadeInSlide delay={120}>
            <LoadingCard summary={summary} theme={theme} />
          </FadeInSlide>
        ) : null}
        <FadeInSlide delay={120}>
          <LastNightCard summary={summary} theme={theme} />
        </FadeInSlide>
        <FadeInSlide delay={180}>
          {mode === 'Week' ? (
            <WeekChart records={summary.rangeRecords} settings={data.settings} theme={theme} />
          ) : mode === '7-Night Avg' ? (
            <MovingAverageCard records={summary.rangeRecords} settings={data.settings} theme={theme} />
          ) : mode === 'Score' ? (
            <AlignmentScoreCard records={summary.rangeRecords} settings={data.settings} theme={theme} />
          ) : (
            <ModeCard mode={mode} settings={data.settings} summary={summary} theme={theme} />
          )}
        </FadeInSlide>
        <FadeInSlide delay={240}>
          <SleepToggleCard onSessionChange={refreshDashboard} />
        </FadeInSlide>
      </ScrollView>
      <MetricsExplanationSheet onClose={() => setInfoVisible(false)} theme={theme} visible={infoVisible} />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    marginHorizontal: Spacing.two,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 28,
    marginTop: Spacing.one,
  },
  content: {
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset + Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.six,
    width: '100%',
  },
  dateLine: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  dragIndicator: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 4,
    marginBottom: Spacing.three,
    width: 42,
  },
  duration34: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 40,
  },
  greeting: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  greetingButton: {
    flex: 1,
    gap: Spacing.two,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 132,
  },
  infoButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  infoText: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  lastNightDetails: {
    gap: Spacing.one,
  },
  lastNightGrid: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  metricPill: {
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: '31%',
    flexGrow: 1,
    gap: Spacing.half,
    minWidth: 96,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  modalOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalRoot: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  rangeButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'flex-end',
    marginTop: Spacing.three,
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  segment: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: Spacing.two,
  },
  segmentRow: {
    borderRadius: 18,
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.three,
    padding: Spacing.one,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '86%',
    minHeight: '60%',
    padding: Spacing.four,
  },
  sheetButton: {
    alignItems: 'center',
    borderRadius: 16,
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
  sheetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  sheetText: {
    fontSize: 16,
    lineHeight: 23,
    marginTop: Spacing.three,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 31,
  },
  streakPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
