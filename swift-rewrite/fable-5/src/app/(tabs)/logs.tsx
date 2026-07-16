// ports: Views/Logs/SleepLogsView.swift - the sleep logs tab
// large title, + toolbar button, valid sessions newest first, swipe to delete,
// tap to edit (editor sheet lands in task 13)
import { SymbolView } from 'expo-symbols';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { LogRow } from '@/components/logs/LogRow';
import { Screen } from '@/components/common/Screen';
import type { SleepSession } from '@/domain/models';
import { useSleepStore } from '@/state/app-sleep-store';
import { useTheme } from '@/theme/ThemeProvider';

export default function LogsScreen() {
  const theme = useTheme();
  const sessions = useSleepStore((s) => s.sessions);
  const deleteSession = useSleepStore((s) => s.deleteSession);
  const refresh = useSleepStore((s) => s.refresh);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const openEditor = (_session: SleepSession | null) => {
    // task 13 wires the editor sheet here
  };

  return (
    <Screen>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.addRow}>
              <Pressable
                testID="add-log"
                onPress={() => openEditor(null)}
                style={styles.addButton}>
                <SymbolView name="plus" size={22} tintColor={theme.accent} />
              </Pressable>
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Sleep Logs</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No sleep logs yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Track a night or add one with +
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={[index === 0 && styles.cardTop, index === sessions.length - 1 && styles.cardBottom, styles.cardBody]}>
            <LogRow
              session={item}
              isLast={index === sessions.length - 1}
              onPress={() => openEditor(item)}
              onDelete={() => deleteSession(item.id)}
            />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 120 },
  header: { gap: 8, marginBottom: 16 },
  addRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(28, 28, 30, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ios large title
  title: { fontSize: 34, fontWeight: '700' },
  cardBody: { overflow: 'hidden' },
  cardTop: { borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  cardBottom: { borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  empty: { alignItems: 'center', paddingTop: 120, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySubtitle: { fontSize: 14 },
});
