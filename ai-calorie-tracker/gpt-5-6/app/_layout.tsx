import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { DayProvider } from '@/state/day-context';

SplashScreen.setOptions({ duration: 300, fade: true });

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DayProvider>
        <AppTabs />
      </DayProvider>
    </ThemeProvider>
  );
}
