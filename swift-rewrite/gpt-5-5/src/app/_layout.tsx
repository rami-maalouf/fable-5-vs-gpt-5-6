import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SleepAppearanceProvider } from '@/theme/sleep-appearance';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SleepAppearanceProvider>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="log-editor" options={{ presentation: 'formSheet' }} />
            <Stack.Screen name="sleep-tips" options={{ presentation: 'card' }} />
          </Stack>
        </SleepAppearanceProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
