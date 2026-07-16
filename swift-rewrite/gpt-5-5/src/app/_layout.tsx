import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import {
  SleepAppearanceProvider,
  useSleepSettings,
  useSleepSettingsReady,
} from '@/theme/sleep-appearance';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const settings = useSleepSettings();
  const settingsReady = useSleepSettingsReady();

  if (!settingsReady) {
    return null;
  }

  if (!settings.isOnboarded) {
    return <OnboardingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="log-editor" options={{ presentation: 'formSheet' }} />
      <Stack.Screen name="sleep-tips" options={{ presentation: 'card' }} />
      <Stack.Screen name="onboarding" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SleepAppearanceProvider>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </SleepAppearanceProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
