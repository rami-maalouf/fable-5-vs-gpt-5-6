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
import { useNovaTheme } from '@/theme';

async function initializeDatabase(db: SQLiteDatabase) {
  await migrateDatabaseAsync(createExpoSqlDatabaseAdapter(db));
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const novaTheme = useNovaTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: novaTheme.colors.background }}>
        <KeyboardProvider>
          <SQLiteProvider databaseName={NOVA_DATABASE_NAME} onInit={initializeDatabase}>
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
