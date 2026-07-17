// root layout: navigation theme from semantic tokens, day state, single stack.
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DayProvider } from '@/state/day-context';
import { getColorTokens } from '@/theme/tokens';

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = getColorTokens(scheme);
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <DayProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="scan"
            options={{ presentation: 'fullScreenModal' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </DayProvider>
    </ThemeProvider>
  );
}
