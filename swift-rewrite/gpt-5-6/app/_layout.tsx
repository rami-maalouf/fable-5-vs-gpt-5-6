// ports: twilight/twilightapp.swift

import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  ActiveSleepSessionProvider,
  useActiveSleepSession,
} from '@/session/ActiveSleepSessionProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ActiveSleepSessionProvider>
        <SleepAwareTheme />
      </ActiveSleepSessionProvider>
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

  return (
    <>
      <StatusBar style={theme.colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
