import { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
} from 'react-native';

import { EmptyState } from '@/components/chat/empty-state';
import { MessageRow } from '@/components/chat/message-row';
import type { ChatMessage } from '@/lib/chat-state';

type MessageListProps = {
  conversationId: string | null;
  messages: ChatMessage[];
  onRetry: () => void;
};

const BOTTOM_THRESHOLD = 48;

function isNearBottom(event: NativeSyntheticEvent<NativeScrollEvent>) {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  return contentSize.height - contentOffset.y - layoutMeasurement.height <= BOTTOM_THRESHOLD;
}

export function MessageList({ conversationId, messages, onRetry }: MessageListProps) {
  const list = useRef<FlatList<ChatMessage>>(null);
  const shouldFollowContent = useRef(true);
  const isUserScrolling = useRef(false);
  const previousMessageCount = useRef(messages.length);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);

  const scrollToBottom = useCallback((animated: boolean) => {
    const offset = Math.max(0, contentHeight.current - viewportHeight.current);
    list.current?.scrollToOffset({ animated, offset });
  }, []);

  useEffect(() => {
    shouldFollowContent.current = true;
    isUserScrolling.current = false;
    let secondFrame: number | undefined;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => scrollToBottom(false));
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) {
        cancelAnimationFrame(secondFrame);
      }
    };
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      shouldFollowContent.current = true;
      requestAnimationFrame(() => scrollToBottom(true));
    }
    previousMessageCount.current = messages.length;
  }, [messages.length, scrollToBottom]);

  return (
    <FlatList
      ref={list}
      contentContainerStyle={[styles.content, messages.length === 0 && styles.emptyContent]}
      contentInsetAdjustmentBehavior="automatic"
      data={messages}
      keyExtractor={(message) => message.id}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={EmptyState}
      onContentSizeChange={(_width, height) => {
        contentHeight.current = height;
        if (shouldFollowContent.current && !isUserScrolling.current) {
          scrollToBottom(false);
        }
      }}
      onLayout={(event) => {
        viewportHeight.current = event.nativeEvent.layout.height;
        if (shouldFollowContent.current && !isUserScrolling.current) {
          scrollToBottom(false);
        }
      }}
      onScrollBeginDrag={() => {
        isUserScrolling.current = true;
        shouldFollowContent.current = false;
      }}
      onScrollEndDrag={(event) => {
        shouldFollowContent.current = isNearBottom(event);

        if (!event.nativeEvent.velocity?.y) {
          isUserScrolling.current = false;
        }
      }}
      onMomentumScrollEnd={(event) => {
        if (isUserScrolling.current) {
          isUserScrolling.current = false;
          shouldFollowContent.current = isNearBottom(event);
        }
      }}
      removeClippedSubviews={false}
      renderItem={({ item }) => <MessageRow message={item} onRetry={onRetry} />}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 16,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContent: {
    justifyContent: 'center',
  },
});
