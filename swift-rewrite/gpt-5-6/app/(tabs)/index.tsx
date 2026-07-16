// ports: twilight/views/sleepdashboardview.swift

import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInSlide } from '@/components/common/fade-in-slide';
import { GlowingMoonView } from '@/components/common/glowing-moon-view';
import { ScreenBackground } from '@/components/common/screen-background';
import { DashboardOverviewCard } from '@/components/dashboard/DashboardOverviewCard';
import {
  SegmentedPicker,
  type DashboardViewMode,
} from '@/components/dashboard/SegmentedPicker';
import { SleepToggleCard } from '@/components/dashboard/sleep-toggle-card';
import { getGreeting, getShuffledGreeting } from '@/copy/greetings';
import { getSessionRepository } from '@/data/session-repo';
import { settingsStore } from '@/data/settings-store';
import {
  createNightRecords,
  currentStreak,
  goalDurationHours,
  recordsInRange,
} from '@/domain/metrics/core';
import type { SleepSession } from '@/domain/models';
import { useActiveSleepSession } from '@/session/ActiveSleepSessionProvider';
import { useTheme } from '@/theme/ThemeProvider';

interface GoalTimes {
  sleepMinutes: number;
  wakeMinutes: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    activeSession,
    clearError,
    errorMessage,
    isHydrated,
    isMutating,
    toggle,
  } = useActiveSleepSession();
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [goals, setGoals] = useState<GoalTimes>({ sleepMinutes: 22 * 60, wakeMinutes: 7 * 60 });
  const [mode, setMode] = useState<DashboardViewMode>('week');
  const [rangeDays, setRangeDays] = useState<90 | null>(90);
  const [greetingOverride, setGreetingOverride] = useState<string | null>(null);
  const [joke, setJoke] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);

  const loadDashboard = useCallback(async () => {
    try {
      const repository = await getSessionRepository();
      const [loadedSessions, sleepMinutes, wakeMinutes] = await Promise.all([
        repository.listValid(),
        settingsStore.get('optimalSleepMinutes'),
        settingsStore.get('optimalWakeMinutes'),
      ]);
      setSessions(loadedSessions);
      setGoals({ sleepMinutes, wakeMinutes });
    } catch {
      setSessions([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  useEffect(() => {
    if (!activeSession) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [activeSession]);

  useEffect(() => {
    if (!joke) {
      return;
    }
    const timer = setTimeout(() => setJoke(null), 6_000);
    return () => clearTimeout(timer);
  }, [joke]);

  const currentMinutes = new Date(now).getHours() * 60 + new Date(now).getMinutes();
  const defaultGreeting = useMemo(
    () => getGreeting(
      currentMinutes,
      goals.sleepMinutes,
      goals.wakeMinutes,
      activeSession !== null,
    ),
    [activeSession, currentMinutes, goals.sleepMinutes, goals.wakeMinutes],
  );
  const displayedGreeting = greetingOverride ?? defaultGreeting;

  const allRecords = useMemo(() => createNightRecords(sessions), [sessions]);
  const referenceDayKey = localDayKey(new Date(now));
  const records = useMemo(
    () => recordsInRange(allRecords, rangeDays, referenceDayKey),
    [allRecords, rangeDays, referenceDayKey],
  );
  const targetDurationHours = goalDurationHours(goals.sleepMinutes, goals.wakeMinutes);
  const targetSleepOffset = offsetForMinutes(goals.sleepMinutes);
  const targetWakeOffset = offsetForMinutes(goals.wakeMinutes);
  const lastNight = allRecords.at(-1) ?? null;
  const previousNight = allRecords.at(-2) ?? null;
  const durationChangePercent = lastNight && previousNight && previousNight.durationHours > 0
    ? ((lastNight.durationHours - previousNight.durationHours) / previousNight.durationHours) * 100
    : null;
  const elapsedSeconds = activeSession
    ? Math.max(0, Math.floor((now - activeSession.startTime) / 1_000))
    : 0;

  const handleToggle = async () => {
    if (!isHydrated || isMutating) {
      return;
    }
    try {
      const result = await toggle();
      if (result.kind === 'started') {
        setGreetingOverride(null);
        setJoke(null);
        setNow(Date.now());
      } else {
        setGreetingOverride(null);
        setJoke(result.joke);
        await loadDashboard();
      }
    } catch {
      setJoke(null);
    }
  };

  const shuffleGreeting = () => {
    setGreetingOverride(
      getShuffledGreeting(
        displayedGreeting,
        currentMinutes,
        goals.sleepMinutes,
        goals.wakeMinutes,
        activeSession !== null,
      ),
    );
  };

  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel="Home screen" edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeInSlide>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" onPress={shuffleGreeting} style={styles.greetingButton}>
                <Text accessibilityRole="header" numberOfLines={2} style={[styles.greeting, { color: theme.textPrimary }]}>
                  {displayedGreeting}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="How sleep metrics work"
                accessibilityRole="button"
                onPress={() => router.push('/metrics-explanation')}
                style={styles.infoButton}
              >
                <SymbolView name="info.circle" size={26} tintColor={theme.textSecondary} />
              </Pressable>
              <View pointerEvents="none" style={styles.moon}>
                <GlowingMoonView size={22} />
              </View>
              <Text style={[styles.date, { color: theme.textSecondary }]}>
                {formatDashboardDate(new Date(now))}
              </Text>
            </View>
          </FadeInSlide>

          <FadeInSlide delay={60}>
            <View style={styles.controls}>
              <SegmentedPicker onChange={setMode} value={mode} />
              <View style={[styles.rangePicker, { backgroundColor: theme.actionSecondary }]}>
                <RangeButton label="90D" onPress={() => setRangeDays(90)} selected={rangeDays === 90} />
                <RangeButton label="All" onPress={() => setRangeDays(null)} selected={rangeDays === null} />
              </View>
            </View>
          </FadeInSlide>

          <FadeInSlide delay={120}>
            <DashboardOverviewCard
              mode={mode}
              records={records}
              targetDurationHours={targetDurationHours}
              targetSleepOffset={targetSleepOffset}
              targetWakeOffset={targetWakeOffset}
            />
          </FadeInSlide>

          <FadeInSlide delay={180}>
            <SleepToggleCard
              activeSession={activeSession}
              durationChangePercent={durationChangePercent}
              elapsedSeconds={elapsedSeconds}
              isBusy={!isHydrated || isMutating}
              joke={joke ?? errorMessage}
              lastNightDurationHours={lastNight?.durationHours ?? null}
              onToggle={() => {
                clearError();
                void handleToggle();
              }}
              streak={currentStreak(allRecords, referenceDayKey)}
            />
          </FadeInSlide>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function RangeButton({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress(): void;
  selected: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.rangeButton, selected && { backgroundColor: theme.actionPrimary }]}
    >
      <Text style={[styles.rangeLabel, { color: selected ? '#ffffff' : theme.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function offsetForMinutes(minutes: number): number {
  const hour = minutes / 60;
  return (hour < 18 ? hour + 24 : hour) - 18;
}

function formatDashboardDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 118, paddingTop: 24 },
  controls: { gap: 9, paddingHorizontal: 16 },
  date: { fontSize: 16, fontWeight: '600', marginTop: 5 },
  greeting: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8, lineHeight: 39 },
  greetingButton: { maxWidth: '90%' },
  header: { marginHorizontal: 20, minHeight: 94, position: 'relative' },
  infoButton: { padding: 6, position: 'absolute', right: 0, top: 12 },
  moon: { opacity: 0.28, position: 'absolute', right: 18, top: -22 },
  rangeButton: { alignItems: 'center', borderRadius: 10, minWidth: 48, paddingHorizontal: 12, paddingVertical: 6 },
  rangeLabel: { fontSize: 11, fontWeight: '800' },
  rangePicker: { alignSelf: 'flex-end', borderRadius: 12, flexDirection: 'row', padding: 2 },
  safeArea: { flex: 1 },
});
