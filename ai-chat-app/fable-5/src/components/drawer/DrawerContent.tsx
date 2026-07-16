import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConversationRow } from '@/components/drawer/ConversationRow';
import { SearchField } from '@/components/drawer/SearchField';
import { getDb } from '@/data/client-db';
import { deleteConversation, renameConversation } from '@/data/conversation-repo';
import { listMessages } from '@/data/message-repo';
import type { Conversation } from '@/domain/messages';
import { filterConversations } from '@/domain/search';
import { useChatStore } from '@/state/chat-store';
import { useConversationsStore } from '@/state/conversations-store';
import { useDrawerStore } from '@/state/drawer-store';
import { colors, spacing } from '@/theme/tokens';

export function DrawerContent() {
  const open = useDrawerStore((s) => s.open);
  const setOpen = useDrawerStore((s) => s.setOpen);
  const entries = useConversationsStore((s) => s.entries);
  const query = useConversationsStore((s) => s.query);
  const setQuery = useConversationsStore((s) => s.setQuery);
  const refresh = useConversationsStore((s) => s.refresh);
  const activeConversationId = useChatStore((s) => s.conversationId);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const openConversation = useCallback(
    async (conversation: Conversation) => {
      const db = await getDb();
      const messages = await listMessages(db, conversation.id);
      useChatStore.getState().loadConversation(conversation, messages);
      setOpen(false);
    },
    [setOpen],
  );

  const newChat = useCallback(() => {
    useChatStore.getState().reset();
    setOpen(false);
  }, [setOpen]);

  const handleRename = useCallback(
    (conversation: Conversation) => {
      // native text-field alert
      Alert.prompt(
        'Rename chat',
        undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (value?: string) => {
              const title = value?.trim();
              if (!title) return;
              void (async () => {
                const db = await getDb();
                await renameConversation(db, conversation.id, title);
                await refresh();
              })();
            },
          },
        ],
        'plain-text',
        conversation.title,
      );
    },
    [refresh],
  );

  const handleDelete = useCallback(
    (conversation: Conversation) => {
      Alert.alert('Delete chat?', 'This conversation and its messages will be deleted.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const db = await getDb();
              await deleteConversation(db, conversation.id);
              await refresh();
              // deleting the open conversation falls back to a fresh chat
              if (useChatStore.getState().conversationId === conversation.id) {
                useChatStore.getState().reset();
              }
            })();
          },
        },
      ]);
    },
    [refresh],
  );

  const filtered = filterConversations(entries, query);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <View style={styles.searchWrap}>
          <SearchField value={query} onChange={setQuery} />
        </View>
        <Pressable
          onPress={newChat}
          style={styles.newChatButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="New chat"
        >
          <SymbolView name="square.and.pencil" size={22} tintColor={colors.label} fallback={null} />
        </Pressable>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            isActive={item.id === activeConversationId}
            onPress={openConversation}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query.trim() ? 'No results' : 'No conversations yet'}
          </Text>
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  searchWrap: {
    flex: 1,
  },
  newChatButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontSize: 15,
    color: colors.tertiaryLabel,
  },
});
