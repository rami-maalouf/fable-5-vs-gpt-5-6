import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { settingsStore } from '@/data/app-db';
import { updateWindDownNotification } from '@/services/notifications';
import { useLiveActivitySync } from '@/services/use-live-activity-sync';
import { useSleepStore } from '@/state/app-sleep-store';
import { useSettings } from '@/state/settings-state';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  // the original applies .grayscale(1.0) on the app root while sleeping;
  // the port swaps in the desaturated palette (spike 3 decision)
  const isSleeping = useSleepStore((s) => s.activeSession != null);
  // onboarding gate: fresh installs land in the 4-step flow
  const isOnboarded = useSettings((s) => s.isOnboarded);

  // live activity lifecycle (parity + superpower wiring)
  useLiveActivitySync();

  // wind-down reminder: (re)schedule on launch, bedtime change, and toggle
  const windDownEnabled = useSettings((s) => s.windDownReminderEnabled);
  const optimalSleepMinutes = useSettings((s) => s.optimalSleepMinutes);
  useEffect(() => {
    if (!isOnboarded) return;
    updateWindDownNotification(windDownEnabled, optimalSleepMinutes).catch(() => {
      // permission denied or notifications unavailable - nothing to schedule
    });
  }, [isOnboarded, windDownEnabled, optimalSleepMinutes]);

  return (
    <ThemeProvider store={settingsStore} desaturated={isSleeping}>
      <StatusBar style="light" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        {!isOnboarded && <Redirect href="/onboarding" />}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="log-editor" options={{ presentation: 'modal' }} />
          <Stack.Screen name="sleep-tips" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="timeline-sheet"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.82, 1.0],
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="metrics-explanation"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.6, 1.0],
              sheetGrabberVisible: true,
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
