import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ConversationRow } from '@/components/drawer/conversation-row';
import type { ConversationRecord } from '@/lib/db';
import { colors } from '@/theme/colors';

type ConversationListProps = {
  activeConversationId: string | null;
  conversations: ConversationRecord[];
  error: string | null;
  isLoading: boolean;
  onNewChat: () => void;
  onRefresh: () => void;
  onSelect: (conversationId: string) => void;
};

export function ConversationList({
  activeConversationId,
  conversations,
  error,
  isLoading,
  onNewChat,
  onRefresh,
  onSelect,
}: ConversationListProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Start a new chat"
        accessibilityRole="button"
        onPress={onNewChat}
        style={({ pressed }) => [styles.newChatButton, pressed && styles.pressed]}>
        <SymbolView
          name="square.and.pencil"
          size={19}
          tintColor={colors.label as string}
        />
        <Text style={styles.newChatLabel}>New chat</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Conversations</Text>

      {isLoading && conversations.length === 0 ? (
        <View accessibilityLabel="Loading conversations" accessibilityRole="progressbar" style={styles.centerState}>
          <ActivityIndicator color={colors.secondaryLabel as string} />
        </View>
      ) : error && conversations.length === 0 ? (
        <View style={styles.centerState}>
          <Text accessibilityRole="alert" style={styles.stateText}>
            {error}
          </Text>
          <Pressable
            accessibilityLabel="Retry loading conversations"
            accessibilityRole="button"
            onPress={onRefresh}
            style={styles.retryButton}>
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={
            conversations.length === 0 ? styles.emptyList : styles.listContent
          }
          data={conversations}
          keyboardDismissMode="on-drag"
          keyExtractor={(conversation) => conversation.id}
          ListEmptyComponent={
            <Text style={styles.stateText}>No conversations yet</Text>
          }
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              isActive={item.id === activeConversationId}
              onPress={() => onSelect(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
  },
  emptyList: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  listContent: {
    gap: 2,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  newChatButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 20,
  },
  newChatLabel: {
    color: colors.label,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.55,
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 72,
  },
  retryLabel: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
  },
  sectionTitle: {
    color: colors.secondaryLabel,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0,
    paddingBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  stateText: {
    color: colors.secondaryLabel,
    fontSize: 15,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
