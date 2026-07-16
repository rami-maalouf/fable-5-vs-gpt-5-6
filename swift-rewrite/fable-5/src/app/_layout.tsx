import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { settingsStore } from '@/data/app-db';
import { useSleepStore } from '@/state/app-sleep-store';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  // the original applies .grayscale(1.0) on the app root while sleeping;
  // the port swaps in the desaturated palette (spike 3 decision)
  const isSleeping = useSleepStore((s) => s.activeSession != null);
  return (
    <ThemeProvider store={settingsStore} desaturated={isSleeping}>
      <StatusBar style="light" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
