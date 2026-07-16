// ports: twilight/views/sleepmetricsview.swift

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInSlide } from '@/components/common/fade-in-slide';
import { PlatformSymbol } from '@/components/common/platform-symbol';
import { ScreenBackground } from '@/components/common/screen-background';
import { DurationMomentumChart } from '@/components/charts/DurationMomentumChart';
import {
  DurationHistogramChart,
  WeekdayAveragesChart,
} from '@/components/charts/BehaviorPatternCharts';
import { RegularityComponentsChart } from '@/components/charts/RegularityComponentsChart';
import { RollingConsistencyChart } from '@/components/charts/RollingConsistencyChart';
import { SleepDebtChart } from '@/components/charts/SleepDebtChart';
import { MetricsEmptyState } from '@/components/metrics/MetricsEmptyState';
import { MetricsRangePicker } from '@/components/metrics/MetricsRangePicker';
import { MultiStatCard } from '@/components/metrics/MultiStatCard';
import { SectionTitle } from '@/components/metrics/SectionTitle';
import {
  buildMetricsScreenModel,
  type MetricsRange,
} from '@/components/metrics/metrics-screen-model';
import { getSessionRepository } from '@/data/session-repo';
import { settingsStore } from '@/data/settings-store';
import { createNightRecords, goalDurationHours } from '@/domain/metrics/core';
import type { SleepSession } from '@/domain/models';
import { useTheme } from '@/theme/ThemeProvider';

interface GoalTimes {
  sleepMinutes: number;
  wakeMinutes: number;
}

export default function MetricsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [goals, setGoals] = useState<GoalTimes>({ sleepMinutes: 22 * 60, wakeMinutes: 7 * 60 });
  const [range, setRange] = useState<MetricsRange>('90D');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadMetrics = useCallback(async () => {
    setLoadError(false);
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
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMetrics();
    }, [loadMetrics]),
  );

  const allRecords = useMemo(() => createNightRecords(sessions), [sessions]);
  const model = useMemo(
    () => buildMetricsScreenModel({
      allRecords,
      range,
      referenceDayKey: localDayKey(new Date()),
      targetDurationHours: goalDurationHours(goals.sleepMinutes, goals.wakeMinutes),
    }),
    [allRecords, goals.sleepMinutes, goals.wakeMinutes, range],
  );
  const targetDurationHours = goalDurationHours(goals.sleepMinutes, goals.wakeMinutes);
  const targetSleepOffset = offsetForMinutes(goals.sleepMinutes);
  const targetWakeOffset = offsetForMinutes(goals.wakeMinutes);

  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel="Sleep metrics" edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeInSlide>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>Metrics</Text>
              <View style={styles.toolbar}>
                <ToolbarButton
                  accessibilityLabel="Sleep and wake timeline"
                  androidIcon="bar-chart"
                  onPress={() => router.push({ pathname: '/timeline-sheet', params: { range } })}
                  symbol="chart.bar.xaxis"
                />
                <ToolbarButton
                  accessibilityLabel="Metrics guide"
                  androidIcon="information-circle"
                  onPress={() => router.push('/metrics-explanation')}
                  symbol="info.circle"
                />
              </View>
            </View>
            <Text style={[styles.intro, { color: theme.textSecondary }]}>Long-range sleep intelligence from your full history: momentum, regularity, recovery, and behavior patterns.</Text>
          </FadeInSlide>

          <FadeInSlide delay={60}>
            <MetricsRangePicker onChange={setRange} value={range} />
          </FadeInSlide>

          {isLoading ? (
            <View accessibilityLabel="Loading sleep metrics" accessibilityState={{ busy: true }} style={[styles.loading, { backgroundColor: theme.cardBackground }]} />
          ) : loadError ? (
            <MetricsEmptyState detail="Your sleep history could not be loaded. Return to this tab to try again." title="Metrics are taking a night off" />
          ) : model.isEmpty ? (
            <MetricsEmptyState />
          ) : (
            <>
              <FadeInSlide delay={120}>
                <SectionTitle>Overview</SectionTitle>
                <MultiStatCard stats={model.overview} />
              </FadeInSlide>
              <FadeInSlide delay={180}>
                <SectionTitle>Highlights</SectionTitle>
                <MultiStatCard stats={model.highlights} />
              </FadeInSlide>
              <FadeInSlide delay={240}>
                <SectionTitle>Duration Momentum</SectionTitle>
                <DurationMomentumChart
                  records={model.records}
                  targetDurationHours={targetDurationHours}
                />
              </FadeInSlide>
              <FadeInSlide delay={300}>
                <SectionTitle>Regularity</SectionTitle>
                <View style={styles.chartStack}>
                  <RollingConsistencyChart
                    records={model.records}
                    targetSleepOffset={targetSleepOffset}
                    targetWakeOffset={targetWakeOffset}
                  />
                  <RegularityComponentsChart
                    records={model.records}
                    targetSleepOffset={targetSleepOffset}
                    targetWakeOffset={targetWakeOffset}
                  />
                </View>
              </FadeInSlide>
              <FadeInSlide delay={360}>
                <SectionTitle>Recovery</SectionTitle>
                <SleepDebtChart
                  records={model.records}
                  targetDurationHours={targetDurationHours}
                />
              </FadeInSlide>
              <FadeInSlide delay={420}>
                <SectionTitle>Behavior Patterns</SectionTitle>
                <View style={styles.chartStack}>
                  <WeekdayAveragesChart records={model.records} />
                  <DurationHistogramChart records={model.records} />
                </View>
              </FadeInSlide>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function ToolbarButton({
  accessibilityLabel,
  androidIcon,
  onPress,
  symbol,
}: {
  accessibilityLabel: string;
  androidIcon: 'bar-chart' | 'information-circle';
  onPress(): void;
  symbol: string;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.toolbarButton, pressed && styles.pressed]}
    >
      <PlatformSymbol androidName={androidIcon} color={theme.textPrimary} size={24} symbol={symbol} />
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

const styles = StyleSheet.create({
  chartStack: { gap: 16 },
  content: { gap: 20, paddingBottom: 120, paddingHorizontal: 20, paddingTop: 12 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  intro: { fontSize: 15, lineHeight: 21, marginTop: 10 },
  loading: { borderRadius: 24, height: 220, opacity: 0.7 },
  pressed: { opacity: 0.62 },
  safeArea: { flex: 1 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.7 },
  toolbar: { flexDirection: 'row', gap: 5 },
  toolbarButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
});
