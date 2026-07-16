import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { useNovaTheme } from '@/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const novaTheme = useNovaTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: novaTheme.colors.background }}>
        <KeyboardProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: novaTheme.colors.background },
            }}
          />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
