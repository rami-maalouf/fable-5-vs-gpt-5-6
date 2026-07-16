// ports: twilight/views/sleepdashboardview.swift

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlowingMoonView } from '@/components/common/glowing-moon-view';
import { ScreenBackground } from '@/components/common/screen-background';
import { SleepToggleCard } from '@/components/dashboard/sleep-toggle-card';
import { useActiveSleepSession } from '@/session/ActiveSleepSessionProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function HomeScreen() {
  const { theme } = useTheme();
  const {
    activeSession,
    clearError,
    errorMessage,
    isHydrated,
    isMutating,
    toggle,
  } = useActiveSleepSession();
  const [joke, setJoke] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);

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
    if (!isHydrated || isMutating) {
      return;
    }
    try {
      const result = await toggle();
      if (result.kind === 'started') {
        setJoke(null);
        setNow(Date.now());
      } else {
        setJoke(result.joke);
      }
    } catch {
      setJoke(null);
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
            isBusy={!isHydrated || isMutating}
            joke={joke ?? errorMessage}
            onToggle={() => {
              clearError();
              void handleToggle();
            }}
          />
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', paddingBottom: 68 },
  heading: { alignItems: 'center', marginBottom: 18 },
  safeArea: { flex: 1 },
  subtitle: { fontSize: 15, marginTop: 5 },
  title: { fontSize: 30, fontWeight: '800' },
});
