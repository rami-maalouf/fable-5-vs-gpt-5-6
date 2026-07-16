import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ScrollViewProps } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageRow } from '@/components/chat/MessageRow';
import { usePinnedScroll } from '@/hooks/usePinnedScroll';
import type { ChatTranscriptMessage } from '@/state/chat';
import { spacing, useNovaTheme } from '@/theme';

type MessageListProps = {
  isAwaitingFirstToken: boolean;
  messages: ChatTranscriptMessage[];
  onRetryMessage?: (assistantMessageId: string) => void;
};

const COMPOSER_RESERVED_SPACE = 20;
const KEYBOARD_BOTTOM_OFFSET = spacing.sm;

export function MessageList({
  isAwaitingFirstToken,
  messages,
  onRetryMessage,
}: MessageListProps) {
  const theme = useNovaTheme();
  const { bottom } = useSafeAreaInsets();
  const pinnedScroll = usePinnedScroll();
  const {
    bindListRef,
    onContentSizeChange,
    onScroll,
    onScrollBeginDrag,
    scrollToBottom,
    shouldShowScrollToBottom,
  } = pinnedScroll;

  const handleContentSizeChange = useCallback(() => {
    if (messages.length === 0) {
      return;
    }

    onContentSizeChange();
  }, [messages.length, onContentSizeChange]);

  const renderScrollComponent = useCallback((props: ScrollViewProps) => (
    <KeyboardChatScrollView
      {...props}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="interactive"
      keyboardLiftBehavior="whenAtEnd"
      offset={Math.max(bottom - KEYBOARD_BOTTOM_OFFSET, 0)}
    />
  ), [bottom]);

  const renderMessage = useCallback(({ item }: { item: ChatTranscriptMessage }) => (
    <MessageRow
      isAwaitingFirstToken={isAwaitingFirstToken}
      message={item}
      onRetryMessage={onRetryMessage}
    />
  ), [isAwaitingFirstToken, onRetryMessage]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={bindListRef}
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
        onContentSizeChange={handleContentSizeChange}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        renderItem={renderMessage}
        renderScrollComponent={renderScrollComponent}
        scrollEventThrottle={16}
        style={styles.list}
      />

      {shouldShowScrollToBottom ? (
        <Pressable
          accessibilityLabel="scroll to latest message"
          accessibilityRole="button"
          onPress={scrollToBottom}
          style={({ pressed }) => [
            styles.scrollToBottomButton,
            {
              backgroundColor: theme.colors.elevated,
              borderColor: theme.colors.separator,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <SymbolView name="arrow.down" size={16} tintColor={theme.colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  scrollToBottomButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
