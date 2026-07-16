import { SQLiteProvider } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import {
  createExpoSqlDatabaseAdapter,
  migrateDatabaseAsync,
  NOVA_DATABASE_NAME,
} from '@/data';
import { SystemChrome } from '@/components/SystemChrome';
import { novaColorSchemes, useNovaTheme } from '@/theme';

async function initializeDatabase(db: SQLiteDatabase) {
  await migrateDatabaseAsync(createExpoSqlDatabaseAdapter(db));
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const novaTheme = useNovaTheme();
  const rootBackgroundColor = novaColorSchemes[
    novaTheme.scheme === 'dark' ? 'dark' : 'light'
  ].background;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: novaTheme.colors.background }}>
        <KeyboardProvider>
          <SQLiteProvider databaseName={NOVA_DATABASE_NAME} onInit={initializeDatabase}>
            <SystemChrome backgroundColor={rootBackgroundColor} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: novaTheme.colors.background },
              }}
            />
          </SQLiteProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
