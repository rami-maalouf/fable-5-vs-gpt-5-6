import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { NourishStatusBar } from '@/components/system/NourishStatusBar';
import { DayProvider } from '@/state/day-context';
import { ReducedMotionProvider } from '@/state/reduced-motion';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ReducedMotionProvider>
        <DayProvider>
          <NourishStatusBar />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="scan"
              options={{
                presentation: 'fullScreenModal',
              }}
            />
          </Stack>
          <AnimatedSplashOverlay />
        </DayProvider>
      </ReducedMotionProvider>
    </ThemeProvider>
  );
}
