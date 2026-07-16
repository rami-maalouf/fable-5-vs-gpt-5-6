import { useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/chat/EmptyState';
import { MessageRow } from '@/components/chat/MessageRow';
import type { Message } from '@/domain/messages';
import { usePinnedScroll } from '@/hooks/usePinnedScroll';
import type { SendState } from '@/state/chat-store';
import { spacing } from '@/theme/tokens';

type MessageListProps = {
  messages: Message[];
  sendState: SendState;
  streamingMessageId: string | null;
  onRetry: () => void;
};

export function MessageList({
  messages,
  sendState,
  streamingMessageId,
  onRetry,
}: MessageListProps) {
  const listRef = useRef<FlatList<Message>>(null);
  const pinned = usePinnedScroll(listRef);
  const lastMessage = messages[messages.length - 1];

  return (
    <FlatList
      ref={listRef}
      style={styles.list}
      contentContainerStyle={[styles.content, messages.length === 0 && styles.emptyContent]}
      data={messages}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => (
        <MessageRow
          message={item}
          showTypingIndicator={
            item.id === streamingMessageId && sendState === 'awaiting' && item.content === ''
          }
          onRetry={
            item.id === lastMessage?.id && item.status === 'error' ? onRetry : undefined
          }
        />
      )}
      ListEmptyComponent={EmptyState}
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      onScroll={pinned.onScroll}
      onScrollBeginDrag={pinned.onScrollBeginDrag}
      onScrollEndDrag={pinned.onScrollEndDrag}
      onMomentumScrollEnd={pinned.onMomentumScrollEnd}
      onContentSizeChange={pinned.onContentSizeChange}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  emptyContent: {
    flexGrow: 1,
  },
});
