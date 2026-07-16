import { addUserInteractionListener, type UserInteractionEvent } from 'expo-widgets';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/common/glass-card';
import { RoundedButton } from '@/components/common/rounded-button';
import { ScreenBackground } from '@/components/common/screen-background';
import { getSessionRepository } from '@/data/session-repo';
import { useTheme } from '@/theme/ThemeProvider';

import { isWakeInteraction } from './interaction';
import { SleepLiveActivity, type SleepActivityProps } from './sleep-live-activity';

function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function activityProps(startedAt: number, status = 'Sleep session active'): SleepActivityProps {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - startedAt) / 60_000));
  return {
    elapsedLabel: `${elapsedMinutes}m`,
    startedAt,
    status,
  };
}

async function endActiveSession(): Promise<boolean> {
  const repository = await getSessionRepository();
  const active = await repository.getActive();
  if (!active) {
    return false;
  }
  await repository.end(active.id, {
    endTime: Date.now(),
    endTimeZone: currentTimeZone(),
  });
  return true;
}

async function endActivities(): Promise<void> {
  await Promise.all(
    SleepLiveActivity.getInstances().map((instance) =>
      instance.end('immediate', activityProps(Date.now(), 'Session ended'), new Date()),
    ),
  );
}

export default function LiveActivitySpike() {
  const { theme } = useTheme();
  const [status, setStatus] = useState('Idle');

  const refreshSessionStatus = async () => {
    const repository = await getSessionRepository();
    const active = await repository.getActive();
    setStatus(active ? `Active session ${active.id.slice(0, 8)}` : 'No active session');
  };

  useEffect(() => {
    void refreshSessionStatus();
    const subscription = addUserInteractionListener((event: UserInteractionEvent) => {
      if (!isWakeInteraction(event)) {
        return;
      }
      void (async () => {
        const ended = await endActiveSession();
        await endActivities();
        setStatus(ended ? `Wake event received at ${event.timestamp}` : 'Wake event had no session');
      })();
    });

    return () => subscription.remove();
  }, []);

  const start = async () => {
    const repository = await getSessionRepository();
    const existing = await repository.getActive();
    const session =
      existing ??
      (await repository.create({
        startTime: Date.now(),
        startTimeZone: currentTimeZone(),
        tag: 'Live Activity Spike',
      }));
    await endActivities();
    SleepLiveActivity.start(activityProps(session.startTime), 'twilight://live-activity-spike');
    setStatus(`Started with session ${session.id.slice(0, 8)}`);
  };

  const update = async () => {
    const repository = await getSessionRepository();
    const active = await repository.getActive();
    if (!active) {
      setStatus('No active session to update');
      return;
    }
    await Promise.all(
      SleepLiveActivity.getInstances().map((instance) =>
        instance.update(activityProps(active.startTime, 'Wind-down active')),
      ),
    );
    setStatus('Updated all activity instances');
  };

  const end = async () => {
    const ended = await endActiveSession();
    await endActivities();
    setStatus(ended ? 'Ended from the app' : 'No active session to end');
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>
            Live Activity Spike
          </Text>
          <GlassCard style={styles.card}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>STATUS</Text>
            <Text style={[styles.status, { color: theme.textPrimary }]}>{status}</Text>
            <View style={styles.actions}>
              <RoundedButton onPress={() => void start()} title="Start activity" />
              <RoundedButton onPress={() => void update()} title="Update activity" />
              <RoundedButton onPress={() => void end()} title="End activity" />
              <RoundedButton onPress={() => void refreshSessionStatus()} title="Refresh session" />
            </View>
          </GlassCard>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    marginTop: 20,
  },
  card: {
    marginHorizontal: 0,
    marginTop: 24,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  safeArea: {
    flex: 1,
  },
  status: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
});
