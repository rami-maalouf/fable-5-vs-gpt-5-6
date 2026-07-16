import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { EmptyState } from '@/components/chat/EmptyState';
import { MessageRow } from '@/components/chat/MessageRow';
import type { Message } from '@/domain/messages';
import { usePinnedScroll } from '@/hooks/usePinnedScroll';
import type { SendState } from '@/state/chat-store';
import { colors, spacing } from '@/theme/tokens';

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
  // history loads mount silently; only rows born from a live turn animate in
  const animateNewRows = sendState !== 'idle';

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={[styles.content, messages.length === 0 && styles.emptyContent]}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MessageRow
            message={item}
            animateIn={animateNewRows}
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
      {!pinned.isFollowing && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={styles.pillWrap}
        >
          <Pressable
            onPress={pinned.scrollToBottom}
            style={styles.pill}
            accessibilityRole="button"
            accessibilityLabel="Scroll to bottom"
          >
            <SymbolView name="arrow.down" size={16} tintColor={colors.label} fallback={null} />
          </Pressable>
        </Animated.View>
      )}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  emptyContent: {
    flexGrow: 1,
  },
  pillWrap: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
  },
  pill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
