import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/common/screen-background';
import { createSleepLogRow } from '@/components/logs/sleep-log-model';
import { SleepLogRow } from '@/components/logs/SleepLogRow';
import { getSessionRepository } from '@/data/session-repo';
import type { SleepSession } from '@/domain/models';
import { useTheme } from '@/theme/ThemeProvider';

export default function SleepLogsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const repository = await getSessionRepository();
      setSessions(await repository.listValid());
    } catch {
      setError('Twilight could not load your sleep logs.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSessions();
    }, [loadSessions]),
  );

  const deleteSession = async (id: string) => {
    try {
      const repository = await getSessionRepository();
      await repository.delete(id);
      setSessions((current) => current.filter((session) => session.id !== id));
    } catch {
      setError('Twilight could not delete that sleep log.');
    }
  };

  const rows = sessions.map(createSleepLogRow);

  return (
    <ScreenBackground>
      <SafeAreaView accessibilityLabel="Logs screen" edges={['top']} style={styles.safeArea}>
        <FlatList
          contentContainerStyle={[styles.content, rows.length === 0 && styles.emptyContent]}
          data={rows}
          keyExtractor={(row) => row.id}
          ListEmptyComponent={
            <LogsState
              error={error}
              isLoading={isLoading}
              onRetry={() => void loadSessions()}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.textPrimary }]}>Sleep Logs</Text>
              <Pressable
                accessibilityLabel="Add sleep log"
                accessibilityRole="button"
                onPress={() => router.push('/log-editor')}
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.actionPrimary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                testID="add-sleep-log"
              >
                <SymbolView name="plus" size={27} tintColor={theme.accent} />
              </Pressable>
            </View>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => void loadSessions(true)}
              refreshing={isRefreshing}
              tintColor={theme.accent}
            />
          }
          renderItem={({ index, item }) => (
            <SleepLogRow
              isFirst={index === 0}
              isLast={index === rows.length - 1}
              model={item}
              onDelete={() => void deleteSession(item.id)}
              onPress={() => router.push({ pathname: '/log-editor', params: { sessionId: item.id } })}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

function LogsState({
  error,
  isLoading,
  onRetry,
}: {
  error: string | null;
  isLoading: boolean;
  onRetry(): void;
}) {
  const { theme } = useTheme();
  if (isLoading) {
    return <ActivityIndicator color={theme.accent} size="large" style={styles.state} />;
  }
  return (
    <View style={styles.state}>
      <SymbolView
        name={error ? 'exclamationmark.triangle.fill' : 'list.bullet.clipboard'}
        size={48}
        tintColor={error ? theme.warning : theme.accent}
      />
      <Text style={[styles.stateTitle, { color: theme.textPrimary }]}>
        {error ? 'Could not load logs' : 'No sleep logs yet'}
      </Text>
      <Text style={[styles.stateCopy, { color: theme.textSecondary }]}>
        {error ?? 'Track a night or add a sleep log to begin your history.'}
      </Text>
      {error ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.retry, { backgroundColor: theme.actionPrimary }]}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    borderRadius: 27,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  content: { paddingBottom: 116, paddingHorizontal: 16 },
  emptyContent: { flexGrow: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingHorizontal: 4,
    paddingTop: 42,
  },
  retry: { borderRadius: 14, marginTop: 18, paddingHorizontal: 18, paddingVertical: 11 },
  retryText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  safeArea: { flex: 1 },
  state: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 390, paddingHorizontal: 34 },
  stateCopy: { fontSize: 14, lineHeight: 20, marginTop: 7, textAlign: 'center' },
  stateTitle: { fontSize: 21, fontWeight: '800', marginTop: 16 },
  title: { fontSize: 42, fontWeight: '800' },
});
