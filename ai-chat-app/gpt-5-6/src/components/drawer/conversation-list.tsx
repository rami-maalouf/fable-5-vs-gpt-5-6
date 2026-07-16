import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { ConversationRow } from '@/components/drawer/conversation-row';
import { RenameConversationDialog } from '@/components/drawer/rename-conversation-dialog';
import { SearchField } from '@/components/drawer/search-field';
import type { ConversationRecord } from '@/lib/db';
import { colors } from '@/theme/colors';

type ConversationListProps = {
  activeConversationId: string | null;
  conversations: ConversationRecord[];
  error: string | null;
  isLoading: boolean;
  onNewChat: () => void;
  onRefresh: () => void;
  onDelete: (conversationId: string) => Promise<boolean>;
  onRename: (conversationId: string, title: string) => Promise<boolean>;
  onSelect: (conversationId: string) => void;
  onQueryChange: (query: string) => void;
  query: string;
};

export function ConversationList({
  activeConversationId,
  conversations,
  error,
  isLoading,
  onDelete,
  onNewChat,
  onQueryChange,
  onRefresh,
  onRename,
  onSelect,
  query,
}: ConversationListProps) {
  const [conversationToRename, setConversationToRename] =
    useState<ConversationRecord | null>(null);

  const confirmDelete = (conversation: ConversationRecord) => {
    Alert.alert(
      'Delete conversation?',
      `"${conversation.title}" and its messages will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void onDelete(conversation.id),
        },
      ],
    );
  };

  const showConversationActions = (conversation: ConversationRecord) => {
    const rename = () => setConversationToRename(conversation);
    const remove = () => confirmDelete(conversation);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          options: ['Cancel', 'Rename', 'Delete'],
          title: conversation.title,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            rename();
          } else if (buttonIndex === 2) {
            remove();
          }
        },
      );
      return;
    }

    Alert.alert(conversation.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Rename', onPress: rename },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <View style={styles.container}>
      <View
        accessibilityElementsHidden={Boolean(conversationToRename)}
        importantForAccessibility={conversationToRename ? 'no-hide-descendants' : 'auto'}
        style={styles.content}>
        <Pressable
          accessibilityLabel="Start a new chat"
          accessibilityRole="button"
          onPress={() => {
            Keyboard.dismiss();
            onNewChat();
          }}
          style={({ pressed }) => [styles.newChatButton, pressed && styles.pressed]}>
          <SymbolView
            name="square.and.pencil"
            size={19}
            tintColor={colors.label as string}
          />
          <Text style={styles.newChatLabel}>New chat</Text>
        </Pressable>

        <SearchField onChangeText={onQueryChange} value={query} />

        <Text style={styles.sectionTitle}>Conversations</Text>

        {error && conversations.length > 0 ? (
          <View style={styles.inlineError}>
            <Text accessibilityRole="alert" style={styles.inlineErrorText}>
              {error}
            </Text>
            <Pressable
              accessibilityLabel="Retry loading conversations"
              accessibilityRole="button"
              onPress={onRefresh}
              style={styles.inlineRetryButton}>
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading && conversations.length === 0 ? (
          <View
            accessibilityLabel="Loading conversations"
            accessibilityRole="progressbar"
            style={styles.centerState}>
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
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.stateText}>
                {query.trim() ? 'No matches' : 'No conversations yet'}
              </Text>
            }
            renderItem={({ item }) => (
              <ConversationRow
                conversation={item}
                isActive={item.id === activeConversationId}
                onLongPress={() => showConversationActions(item)}
                onPress={() => {
                  Keyboard.dismiss();
                  onSelect(item.id);
                }}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {conversationToRename ? (
        <RenameConversationDialog
          conversation={conversationToRename}
          key={conversationToRename.id}
          onCancel={() => setConversationToRename(null)}
          onSave={async (title) => {
            const didRename = await onRename(conversationToRename.id, title);
            if (didRename) {
              setConversationToRename(null);
            }
            return didRename;
          }}
        />
      ) : null}
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
  content: {
    flex: 1,
  },
  emptyList: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  inlineError: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 20,
  },
  inlineErrorText: {
    color: colors.error,
    flex: 1,
    fontSize: 13,
    letterSpacing: 0,
  },
  inlineRetryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 52,
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
    paddingTop: 16,
  },
  stateText: {
    color: colors.secondaryLabel,
    fontSize: 15,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
