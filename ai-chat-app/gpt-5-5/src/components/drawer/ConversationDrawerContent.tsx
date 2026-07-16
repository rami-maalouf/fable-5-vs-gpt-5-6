import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { searchConversationsAsync } from '@/data';
import type { Conversation, SqlDatabase } from '@/data';
import { spacing, useNovaTheme } from '@/theme';

type ConversationDrawerContentProps = {
  activeConversationId: string | null;
  db: SqlDatabase;
  isOpen: boolean;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
};

export function ConversationDrawerContent({
  activeConversationId,
  db,
  isOpen,
  onNewChat,
  onSelectConversation,
}: ConversationDrawerContentProps) {
  const theme = useNovaTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    void searchConversationsAsync(db, searchQuery)
      .then((items) => {
        if (!cancelled) {
          setConversations(items);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [db, isOpen, searchQuery]);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="start new chat"
        accessibilityRole="button"
        onPress={onNewChat}
        style={({ pressed }) => [
          styles.newChatButton,
          {
            backgroundColor: theme.colors.secondaryFill,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <SymbolView name="square.and.pencil" size={18} tintColor={theme.colors.text} />
        <Text style={[styles.newChatText, { color: theme.colors.text }]}>New chat</Text>
      </Pressable>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.secondaryFill }]}>
        <SymbolView name="magnifyingglass" size={15} tintColor={theme.colors.secondaryText} />
        <TextInput
          accessibilityLabel="search conversations"
          onChangeText={setSearchQuery}
          placeholder="Search"
          placeholderTextColor={theme.colors.tertiaryText}
          returnKeyType="search"
          style={[styles.searchInput, { color: theme.colors.text }]}
          value={searchQuery}
        />
      </View>

      <ScrollView
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
      >
        {conversations.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.secondaryText }]}>
            No saved chats
          </Text>
        ) : conversations.map((item) => {
          const isActive = item.id === activeConversationId;

          return (
            <Pressable
              accessibilityLabel={`open ${item.title}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={item.id}
              onPress={() => onSelectConversation(item.id)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: isActive
                    ? theme.colors.secondaryFill
                    : 'transparent',
                  borderBottomColor: theme.colors.separator,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.rowTitle, { color: theme.colors.text }]}
              >
                {item.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.rowModel, { color: theme.colors.secondaryText }]}
              >
                  {item.model}
                </Text>
              </Pressable>
            );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  newChatButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  newChatText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  searchContainer: {
    minHeight: 38,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: spacing.sm,
  },
  list: {
    flex: 1,
    marginHorizontal: -spacing.md,
    marginTop: spacing.md,
  },
  emptyList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 19,
  },
  row: {
    minHeight: 62,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  rowModel: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
