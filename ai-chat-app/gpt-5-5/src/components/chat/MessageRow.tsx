import { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, LinearTransition } from 'react-native-reanimated';

import { ErrorRow } from '@/components/chat/ErrorRow';
import { isDemoMode } from '@/demo/demo-mode';
import type { ChatTranscriptMessage } from '@/state/chat';
import { spacing, useNovaTheme } from '@/theme';

type MessageRowProps = {
  isAwaitingFirstToken: boolean;
  message: ChatTranscriptMessage;
  onRetryMessage?: (assistantMessageId: string) => void;
};

function MessageRowComponent({
  isAwaitingFirstToken,
  message,
  onRetryMessage,
}: MessageRowProps) {
  const theme = useNovaTheme();

  if (message.role === 'user') {
    return (
      <Animated.View
        entering={isDemoMode ? undefined : FadeInUp.duration(160)}
        layout={isDemoMode ? undefined : LinearTransition.duration(120)}
        style={styles.userRow}
      >
        <View style={[styles.userBubble, { backgroundColor: theme.colors.accent }]}>
          <Text style={[styles.userText, { color: theme.colors.accentText }]}>
            {message.content}
          </Text>
        </View>
      </Animated.View>
    );
  }

  const shouldShowLoading = isAwaitingFirstToken && message.content.length === 0;
  const shouldShowError = message.status === 'error';
  const shouldShowEmptyErrorText = shouldShowError && message.content.length === 0;

  return (
    <Animated.View
      entering={isDemoMode ? undefined : FadeIn.duration(140)}
      layout={isDemoMode ? undefined : LinearTransition.duration(120)}
      style={styles.assistantRow}
    >
      {shouldShowLoading ? (
        <View
          accessibilityLabel="assistant response loading"
          accessibilityRole="progressbar"
          style={styles.loadingRow}
        >
          <ActivityIndicator color={theme.colors.secondaryText} size="small" />
        </View>
      ) : shouldShowEmptyErrorText ? null : (
        <Text
          style={[styles.assistantText, { color: theme.colors.text }]}
        >
          {message.content}
        </Text>
      )}

      {shouldShowError ? (
        <ErrorRow
          message={message.error}
          onRetry={() => onRetryMessage?.(message.id)}
        />
      ) : (
        null
      )}
    </Animated.View>
  );
}

export const MessageRow = memo(MessageRowComponent);

const styles = StyleSheet.create({
  userRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  userBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 16,
    lineHeight: 22,
  },
  assistantRow: {
    alignItems: 'stretch',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  assistantText: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 23,
    width: '100%',
  },
  loadingRow: {
    minHeight: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
