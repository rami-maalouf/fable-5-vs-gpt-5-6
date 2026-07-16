import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ErrorRow } from '@/components/chat/ErrorRow';
import type { Message } from '@/domain/messages';
import { colors, radius, spacing } from '@/theme/tokens';

type MessageRowProps = {
  message: Message;
  // true when the row mounts as part of a live turn (not a history load)
  animateIn?: boolean;
  // true while this row is the actively streaming reply with no text yet
  showTypingIndicator?: boolean;
  // present only when this row is a retryable failed reply (the newest turn)
  onRetry?: () => void;
};

function TypingIndicator() {
  const opacity = useSharedValue(0.9);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.25, { duration: 600 }), -1, true);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.typingDot, style]} />;
}

// chatgpt convention: user messages in a filled right-aligned bubble,
// assistant replies as plain full-width text
export const MessageRow = memo(function MessageRow({
  message,
  animateIn = false,
  showTypingIndicator = false,
  onRetry,
}: MessageRowProps) {
  const entering = animateIn ? FadeInDown.duration(220) : undefined;

  if (message.role === 'user') {
    return (
      <Animated.View entering={entering} style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={entering} style={styles.assistantRow}>
      {showTypingIndicator ? (
        <TypingIndicator />
      ) : (
        <>
          {message.content.length > 0 && (
            <Text style={styles.assistantText}>{message.content}</Text>
          )}
          {message.status === 'error' && <ErrorRow onRetry={onRetry} />}
        </>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: colors.bubble,
    borderRadius: radius.bubble,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 17,
    lineHeight: 23,
    color: colors.label,
  },
  assistantRow: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  assistantText: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.label,
  },
  typingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.label,
    marginTop: 6,
    marginBottom: 2,
  },
});
