import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CardBackground, ScreenChrome } from '@/components/common';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getSessionRepository } from '@/data/session-store';
import type { SleepSession } from '@/domain/models';
import { themes, type AppTheme } from '@/theme';
import { useSleepAppearanceTheme } from '@/theme/sleep-appearance';

import { AddSleepLogButton, SleepLogRow } from './SleepLogRow';
import { EmptyState, ErrorState } from './SleepLogStates';
import { buildSleepLogRows, type SleepLogRowModel } from './sleep-log-rows';

type LoadState = 'loading' | 'ready' | 'error';

export function SleepLogsScreen() {
  const theme = useSleepAppearanceTheme(themes.twilight);
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  const loadSessions = useCallback(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadState('loading');
        const repository = await getSessionRepository();
        const nextSessions = await repository.listValidSessions();

        if (!cancelled) {
          setSessions(nextSessions);
          setLoadState('ready');
        }
      } catch {
        if (!cancelled) {
          setLoadState('error');
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(loadSessions);

  const rows = useMemo(() => buildSleepLogRows(sessions), [sessions]);

  async function deleteSession(id: string) {
    const repository = await getSessionRepository();
    await repository.delete(id);
    setSessions((current) => current.filter((session) => session.id !== id));
  }

  return (
    <ScreenChrome theme={theme}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>history</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Sleep Logs</Text>
          </View>
          <AddSleepLogButton onPress={() => router.push('../log-editor')} theme={theme} />
        </View>

        {loadState === 'error' ? <ErrorState theme={theme} onRetry={loadSessions} /> : null}
        {loadState !== 'error' && rows.length === 0 ? <EmptyState theme={theme} loading={loadState === 'loading'} /> : null}
        {rows.length > 0 ? <SleepLogList onDelete={deleteSession} rows={rows} theme={theme} /> : null}
      </ScrollView>
    </ScreenChrome>
  );
}

type SleepLogListProps = {
  rows: SleepLogRowModel[];
  theme: AppTheme;
  onDelete: (id: string) => void;
};

function SleepLogList({ onDelete, rows, theme }: SleepLogListProps) {
  return (
    <CardBackground theme={theme} style={styles.listCard}>
      {rows.map((row, index) => (
        <SleepLogRow
          key={row.id}
          isLast={index === rows.length - 1}
          onDelete={() => onDelete(row.id)}
          onEdit={() => router.push({ pathname: '../log-editor', params: { id: row.id } })}
          row={row}
          theme={theme}
        />
      ))}
    </CardBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
    flexGrow: 1,
    marginHorizontal: 'auto',
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset + Spacing.four,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.six,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 46,
  },
  listCard: {
    marginHorizontal: 0,
  },
});
