import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { EmptyState } from '@/components/chat/empty-state';
import { MessageRow } from '@/components/chat/message-row';
import {
  getDistanceFromBottom,
  resolveManualScrollState,
} from '@/lib/pinned-scroll';
import type { ChatMessage } from '@/lib/chat-state';
import { colors } from '@/theme/colors';

type MessageListProps = {
  conversationId: string | null;
  messages: ChatMessage[];
  onRetry: () => void;
};

function getScrollState(event: NativeSyntheticEvent<NativeScrollEvent>) {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  return resolveManualScrollState(
    getDistanceFromBottom({
      contentHeight: contentSize.height,
      contentOffsetY: contentOffset.y,
      viewportHeight: layoutMeasurement.height,
    }),
  );
}

export function MessageList({ conversationId, messages, onRetry }: MessageListProps) {
  const list = useRef<FlatList<ChatMessage>>(null);
  const shouldFollowContent = useRef(true);
  const isUserScrolling = useRef(false);
  const previousMessageCount = useRef(messages.length);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = useCallback((animated: boolean) => {
    const offset = Math.max(0, contentHeight.current - viewportHeight.current);
    list.current?.scrollToOffset({ animated, offset });
  }, []);

  const updateManualScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextState = getScrollState(event);
      shouldFollowContent.current = nextState.shouldFollow;
      setShowScrollToBottom(nextState.showScrollToBottom);
    },
    [],
  );

  const returnToBottom = () => {
    shouldFollowContent.current = true;
    isUserScrolling.current = false;
    setShowScrollToBottom(false);
    scrollToBottom(true);
  };

  useEffect(() => {
    shouldFollowContent.current = true;
    isUserScrolling.current = false;
    let secondFrame: number | undefined;
    const firstFrame = requestAnimationFrame(() => {
      setShowScrollToBottom(false);
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
      setShowScrollToBottom(false);
      requestAnimationFrame(() => scrollToBottom(true));
    }
    previousMessageCount.current = messages.length;
  }, [messages.length, scrollToBottom]);

  return (
    <View style={styles.listContainer}>
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
        onMomentumScrollEnd={(event) => {
          updateManualScroll(event);
          isUserScrolling.current = false;
        }}
        onScroll={(event) => {
          if (isUserScrolling.current) {
            updateManualScroll(event);
          }
        }}
        onScrollBeginDrag={() => {
          isUserScrolling.current = true;
          shouldFollowContent.current = false;
        }}
        onScrollEndDrag={(event) => {
          updateManualScroll(event);

          if (!event.nativeEvent.velocity?.y) {
            isUserScrolling.current = false;
          }
        }}
        removeClippedSubviews={false}
        renderItem={({ item }) => <MessageRow message={item} onRetry={onRetry} />}
        scrollEventThrottle={16}
      />
      {showScrollToBottom ? (
        <Pressable
          accessibilityLabel="Scroll to latest message"
          accessibilityRole="button"
          hitSlop={4}
          onPress={returnToBottom}
          style={({ pressed }) => [styles.scrollButton, pressed && styles.scrollButtonPressed]}>
          <SymbolView
            name="arrow.down"
            size={17}
            tintColor={colors.label as string}
          />
        </Pressable>
      ) : null}
    </View>
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
  listContainer: {
    flex: 1,
  },
  scrollButton: {
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderColor: colors.separator,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    bottom: 10,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    width: 44,
  },
  scrollButtonPressed: {
    opacity: 0.6,
  },
});
