import { StyleSheet, Text, View } from 'react-native';

import type { ChatMessage } from '@/hooks/use-chat';
import { colors } from '@/theme/colors';

type MessageBubbleProps = Pick<ChatMessage, 'content' | 'role'>;

export function MessageBubble({ content, role }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser && styles.userRow]}>
      <View style={[styles.message, isUser && styles.userMessage]}>
        <Text selectable style={styles.body}>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
  },
  userRow: {
    alignItems: 'flex-end',
  },
  message: {
    maxWidth: '100%',
  },
  userMessage: {
    backgroundColor: colors.secondaryBackground,
    borderCurve: 'continuous',
    borderRadius: 18,
    maxWidth: '84%',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  body: {
    color: colors.label,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 23,
  },
});
