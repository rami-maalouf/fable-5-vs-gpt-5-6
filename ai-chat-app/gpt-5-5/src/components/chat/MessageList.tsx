import { useCallback, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { MessageRow } from '@/components/chat/MessageRow';
import type { ChatTranscriptMessage } from '@/state/chat';
import { spacing, useNovaTheme } from '@/theme';

type MessageListProps = {
  isAwaitingFirstToken: boolean;
  messages: ChatTranscriptMessage[];
};

const COMPOSER_RESERVED_SPACE = 92;

export function MessageList({ isAwaitingFirstToken, messages }: MessageListProps) {
  const theme = useNovaTheme();
  const listRef = useRef<FlatList<ChatTranscriptMessage>>(null);

  const scrollToEnd = useCallback(() => {
    if (messages.length === 0) {
      return;
    }

    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  return (
    <FlatList
      ref={listRef}
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[
        styles.content,
        messages.length === 0 && styles.emptyContent,
      ]}
      data={messages}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      keyExtractor={(message) => message.id}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            What should we explore?
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.secondaryText }]}>
            Start a conversation with Nova. Your history will live in the sidebar once
            there is something to save.
          </Text>
        </View>
      }
      maintainVisibleContentPosition={{
        autoscrollToTopThreshold: 80,
        minIndexForVisible: 0,
      }}
      onContentSizeChange={scrollToEnd}
      renderItem={({ item }) => (
        <MessageRow isAwaitingFirstToken={isAwaitingFirstToken} message={item} />
      )}
      scrollEventThrottle={16}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: COMPOSER_RESERVED_SPACE,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: COMPOSER_RESERVED_SPACE,
  },
  emptyTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
});
