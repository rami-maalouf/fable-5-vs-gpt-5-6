import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { settingsStore } from '@/data/app-db';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider store={settingsStore}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
