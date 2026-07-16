import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { ChatTranscriptMessage } from '@/state/chat';
import { spacing, useNovaTheme } from '@/theme';

type MessageRowProps = {
  isAwaitingFirstToken: boolean;
  message: ChatTranscriptMessage;
};

export function MessageRow({ isAwaitingFirstToken, message }: MessageRowProps) {
  const theme = useNovaTheme();

  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={[styles.userBubble, { backgroundColor: theme.colors.accent }]}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  const shouldShowLoading = isAwaitingFirstToken && message.content.length === 0;

  return (
    <View style={styles.assistantRow}>
      {shouldShowLoading ? (
        <View
          accessibilityLabel="assistant response loading"
          accessibilityRole="progressbar"
          style={styles.loadingRow}
        >
          <ActivityIndicator color={theme.colors.secondaryText} size="small" />
        </View>
      ) : (
        <Text style={[styles.assistantText, { color: theme.colors.text }]}>
          {message.content}
        </Text>
      )}
    </View>
  );
}

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
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
  },
  assistantRow: {
    alignItems: 'stretch',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  assistantText: {
    fontSize: 16,
    lineHeight: 23,
  },
  loadingRow: {
    minHeight: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
