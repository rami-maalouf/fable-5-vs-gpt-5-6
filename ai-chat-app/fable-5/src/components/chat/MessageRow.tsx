import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Message } from '@/domain/messages';
import { colors, radius, spacing } from '@/theme/tokens';

type MessageRowProps = {
  message: Message;
  // true while this row is the actively streaming reply with no text yet
  showTypingIndicator?: boolean;
};

// chatgpt convention: user messages in a filled right-aligned bubble,
// assistant replies as plain full-width text
export const MessageRow = memo(function MessageRow({
  message,
  showTypingIndicator = false,
}: MessageRowProps) {
  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      {showTypingIndicator ? (
        <View style={styles.typingDot} />
      ) : (
        <Text style={styles.assistantText}>{message.content}</Text>
      )}
    </View>
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
