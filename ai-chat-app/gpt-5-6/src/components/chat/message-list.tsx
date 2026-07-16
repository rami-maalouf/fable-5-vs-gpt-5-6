import { useEffect, useRef } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
} from 'react-native';

import { EmptyState } from '@/components/chat/empty-state';
import { MessageBubble } from '@/components/chat/message-bubble';
import type { ChatMessage } from '@/hooks/use-chat';

type MessageListProps = {
  messages: ChatMessage[];
};

const BOTTOM_THRESHOLD = 48;

function isNearBottom(event: NativeSyntheticEvent<NativeScrollEvent>) {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  return contentSize.height - contentOffset.y - layoutMeasurement.height <= BOTTOM_THRESHOLD;
}

export function MessageList({ messages }: MessageListProps) {
  const list = useRef<FlatList<ChatMessage>>(null);
  const shouldFollowContent = useRef(true);
  const isUserScrolling = useRef(false);
  const previousMessageCount = useRef(messages.length);

  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      shouldFollowContent.current = true;
      requestAnimationFrame(() => list.current?.scrollToEnd({ animated: true }));
    }
    previousMessageCount.current = messages.length;
  }, [messages.length]);

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
      onContentSizeChange={() => {
        if (shouldFollowContent.current && !isUserScrolling.current) {
          list.current?.scrollToEnd({ animated: false });
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
      renderItem={({ item }) => <MessageBubble content={item.content} role={item.role} />}
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
