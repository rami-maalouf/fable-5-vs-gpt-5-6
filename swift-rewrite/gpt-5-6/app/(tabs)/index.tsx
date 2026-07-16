// ports: twilight/views/sleepdashboardview.swift

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlowingMoonView } from '@/components/common/glowing-moon-view';
import { ScreenBackground } from '@/components/common/screen-background';
import { SleepToggleCard } from '@/components/dashboard/sleep-toggle-card';
import { toggleSleepSession } from '@/components/dashboard/sleep-toggle';
import { getSessionRepository } from '@/data/session-repo';
import type { SleepSession } from '@/domain/models';
import { useTheme } from '@/theme/ThemeProvider';

export default function HomeScreen() {
  const { theme } = useTheme();
  const [activeSession, setActiveSession] = useState<SleepSession | null>(null);
  const [isBusy, setIsBusy] = useState(true);
  const [joke, setJoke] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      setIsBusy(true);
      void getSessionRepository()
        .then((repository) => repository.getActive())
        .then((session) => {
          if (isCurrent) {
            setActiveSession(session);
            setNow(Date.now());
          }
        })
        .catch(() => {
          if (isCurrent) {
            setJoke('Twilight could not restore your sleep session. Please try again.');
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsBusy(false);
          }
        });
      return () => {
        isCurrent = false;
      };
    }, []),
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

  const handleToggle = async () => {
    if (isBusy) {
      return;
    }
    setIsBusy(true);
    try {
      const repository = await getSessionRepository();
      const result = await toggleSleepSession(repository, {
        now: Date.now(),
        timeZone: currentTimeZone(),
      });
      if (result.kind === 'started') {
        setActiveSession(result.session);
        setJoke(null);
        setNow(Date.now());
      } else {
        setActiveSession(null);
        setJoke(result.joke);
      }
    } catch {
      setJoke('Twilight could not update your sleep session. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const elapsedSeconds = activeSession
    ? Math.max(0, Math.floor((now - activeSession.startTime) / 1_000))
    : 0;

  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel="Home screen" edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          <GlowingMoonView />
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>Twilight</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {activeSession ? 'Your sleep is being tracked.' : 'A quieter night starts here.'}
            </Text>
          </View>

          <SleepToggleCard
            activeSession={activeSession}
            elapsedSeconds={elapsedSeconds}
            isBusy={isBusy}
            joke={joke}
            onToggle={() => void handleToggle()}
          />
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', paddingBottom: 68 },
  heading: { alignItems: 'center', marginBottom: 18 },
  safeArea: { flex: 1 },
  subtitle: { fontSize: 15, marginTop: 5 },
  title: { fontSize: 30, fontWeight: '800' },
});
