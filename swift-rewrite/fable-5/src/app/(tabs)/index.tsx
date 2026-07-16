// minimal dashboard (task 10): sleep toggle end to end. the full dashboard
// (greeting, view modes, charts) lands in tasks 17-19.
import { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { StatusCard } from '@/components/dashboard/StatusCard';
import { Screen } from '@/components/common/Screen';
import type { SleepSession } from '@/domain/models';
import { canonicalNight, dayKey, sessionDurationSeconds, wakeDay } from '@/domain/session-rules';
import { useSleepStore } from '@/state/app-sleep-store';

export default function DashboardScreen() {
  const activeSession = useSleepStore((s) => s.activeSession);
  const sessions = useSleepStore((s) => s.sessions);
  const toggleSleep = useSleepStore((s) => s.toggleSleep);
  const refresh = useSleepStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // canonical night of the most recent wake day, vs the previous one
  const lastSession = latestNight(sessions);
  const changePercent = lastSession ? durationChangePercent(sessions, lastSession) : null;

  const onToggle = () => {
    const result = toggleSleep();
    if (result.joke) {
      Alert.alert('Pause...', result.joke);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <StatusCard
          isSleeping={activeSession != null}
          lastSession={lastSession}
          changePercent={changePercent}
          streak={0}
          onToggle={onToggle}
        />
      </ScrollView>
    </Screen>
  );
}

// most recent wake day's canonical (longest) session
function latestNight(sessions: readonly SleepSession[]) {
  if (sessions.length === 0) return null;
  const newestDay = dayKey(wakeDay(sessions[0]));
  const sameDay = sessions.filter((s) => dayKey(wakeDay(s)) === newestDay);
  return canonicalNight(sameDay);
}

function durationChangePercent(
  sessions: readonly SleepSession[],
  last: SleepSession
): number | null {
  const lastDay = dayKey(wakeDay(last));
  const previous = sessions
    .filter((s) => dayKey(wakeDay(s)) < lastDay)
    .sort((a, b) => (dayKey(wakeDay(a)) < dayKey(wakeDay(b)) ? 1 : -1));
  if (previous.length === 0) return null;
  const prevDay = dayKey(wakeDay(previous[0]));
  const prevNight = canonicalNight(previous.filter((s) => dayKey(wakeDay(s)) === prevDay));
  if (!prevNight) return null;
  const prevDur = sessionDurationSeconds(prevNight);
  const lastDur = sessionDurationSeconds(last);
  if (prevDur <= 0 || lastDur <= 0) return null;
  return ((lastDur - prevDur) / prevDur) * 100;
}

const styles = StyleSheet.create({
  content: { paddingTop: 100, paddingHorizontal: 16, gap: 16 },
});
