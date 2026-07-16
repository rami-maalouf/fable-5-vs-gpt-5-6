// ports: twilight/twilightapp.swift

import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { OnboardingProvider, useOnboarding } from '@/onboarding/OnboardingProvider';

import {
  ActiveSleepSessionProvider,
  useActiveSleepSession,
} from '@/session/ActiveSleepSessionProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OnboardingProvider>
        <ActiveSleepSessionProvider>
          <SleepAwareTheme />
        </ActiveSleepSessionProvider>
      </OnboardingProvider>
    </GestureHandlerRootView>
  );
}

function SleepAwareTheme() {
  const { activeSession } = useActiveSleepSession();
  return (
    <ThemeProvider isSleeping={activeSession !== null}>
      <ThemedApp />
    </ThemeProvider>
  );
}

function ThemedApp() {
  const { theme } = useTheme();
  const { isHydrated, isOnboarded } = useOnboarding();

  if (!isHydrated) {
    return <View style={[styles.loading, { backgroundColor: theme.backgroundGradient[0] }]} />;
  }

  return (
    <>
      <StatusBar style={theme.colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isOnboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={isOnboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="log-editor" />
          <Stack.Screen name="metrics-explanation" />
          <Stack.Screen name="timeline-sheet" />
          <Stack.Screen name="sleep-tips" />
          <Stack.Screen name="live-activity-spike" />
          <Stack.Screen name="chart-spike" />
          <Stack.Screen name="grayscale-spike" />
          <Stack.Screen name="time-picker-spike" />
        </Stack.Protected>
        <Stack.Screen name="restart-onboarding" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
});
