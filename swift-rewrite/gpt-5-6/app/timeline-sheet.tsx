// ports: twilight/views/sleepmetricsview.swift

import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/common/screen-background';
import { SleepTimingTimeline } from '@/components/charts/SleepTimingTimeline';
import { MetricsEmptyState } from '@/components/metrics/MetricsEmptyState';
import { MetricsRangePicker } from '@/components/metrics/MetricsRangePicker';
import {
  METRICS_RANGES,
  rangeDays,
  type MetricsRange,
} from '@/components/metrics/metrics-screen-model';
import { getSessionRepository } from '@/data/session-repo';
import { settingsStore } from '@/data/settings-store';
import { createNightRecords, recordsInRange } from '@/domain/metrics/core';
import type { SleepSession } from '@/domain/models';
import { useTheme } from '@/theme/ThemeProvider';

const screenOptions = {
  headerShown: false,
  presentation: 'formSheet',
  sheetAllowedDetents: [0.82, 1] as number[],
  sheetGrabberVisible: true,
  sheetInitialDetentIndex: 0,
} as const;

export default function TimelineSheetRoute() {
  const router = useRouter();
  const { theme } = useTheme();
  const parameters = useLocalSearchParams<{ range?: string }>();
  const initialRange: MetricsRange = METRICS_RANGES.includes(parameters.range as MetricsRange)
    ? parameters.range as MetricsRange
    : '90D';
  const [range, setRange] = useState<MetricsRange>(initialRange);
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [sleepMinutes, setSleepMinutes] = useState(22 * 60);
  const [wakeMinutes, setWakeMinutes] = useState(7 * 60);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      void (async () => {
        try {
          const repository = await getSessionRepository();
          const [loaded, sleep, wake] = await Promise.all([
            repository.listValid(),
            settingsStore.get('optimalSleepMinutes'),
            settingsStore.get('optimalWakeMinutes'),
          ]);
          if (isCurrent) {
            setSessions(loaded);
            setSleepMinutes(sleep);
            setWakeMinutes(wake);
          }
        } catch {
          if (isCurrent) setSessions([]);
        } finally {
          if (isCurrent) setIsLoading(false);
        }
      })();
      return () => {
        isCurrent = false;
      };
    }, []),
  );

  const allRecords = useMemo(() => createNightRecords(sessions), [sessions]);
  const records = useMemo(
    () => recordsInRange(allRecords, rangeDays(range), localDayKey(new Date())),
    [allRecords, range],
  );
  const targetSleepOffset = offsetForMinutes(sleepMinutes);
  const targetWakeOffset = offsetForMinutes(wakeMinutes);

  return (
    <ScreenBackground>
      <Stack.Screen options={screenOptions} />
      <SafeAreaView accessibilityLabel="Sleep and wake timeline" style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>Sleep/Wake Trend</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Long-range Sleep/Wake Trend</Text>
          </View>
          <Pressable accessibilityLabel="Done" accessibilityRole="button" onPress={() => router.back()} style={styles.doneButton}>
            <Text style={[styles.doneText, { color: theme.accent }]}>Done</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.intro, { color: theme.textSecondary }]}>Horizontal bars show each night from bedtime to wake-up. Use 30D, 90D, 1Y, or All to inspect drift over time.</Text>
          <MetricsRangePicker onChange={setRange} value={range} />
          {isLoading ? (
            <View accessibilityLabel="Loading sleep timeline" accessibilityState={{ busy: true }} style={[styles.loading, { backgroundColor: theme.cardBackground }]} />
          ) : records.length === 0 ? (
            <MetricsEmptyState />
          ) : (
            <SleepTimingTimeline
              records={records}
              targetSleepOffset={targetSleepOffset}
              targetWakeOffset={targetWakeOffset}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function offsetForMinutes(minutes: number): number {
  const hour = minutes / 60;
  return (hour < 18 ? hour + 24 : hour) - 18;
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 28 },
  doneButton: { alignItems: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  doneText: { fontSize: 16, fontWeight: '700' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headerCopy: { flex: 1 },
  intro: { fontSize: 14, lineHeight: 20 },
  loading: { borderRadius: 20, height: 360 },
  safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  subtitle: { fontSize: 13, marginTop: 2 },
  title: { fontSize: 24, fontWeight: '800' },
});
