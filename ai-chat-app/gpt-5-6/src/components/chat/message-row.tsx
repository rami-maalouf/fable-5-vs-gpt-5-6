import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ErrorRow } from '@/components/chat/error-row';
import { MessageBubble } from '@/components/chat/message-bubble';
import type { ChatMessage } from '@/lib/chat-state';
import { colors } from '@/theme/colors';

type MessageRowProps = {
  message: ChatMessage;
  onRetry: () => void;
};

export function MessageRow({ message, onRetry }: MessageRowProps) {
  const showPending = message.role === 'assistant' && message.status === 'pending';
  const showError = message.role === 'assistant' && message.status === 'error';

  return (
    <View style={styles.container}>
      {message.content ? <MessageBubble content={message.content} role={message.role} /> : null}
      {showPending ? (
        <View
          accessible
          accessibilityLabel="Waiting for Nova"
          accessibilityRole="progressbar"
          style={styles.pending}>
          <ActivityIndicator color={colors.secondaryLabel} size="small" />
        </View>
      ) : null}
      {showError ? <ErrorRow onRetry={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  pending: {
    alignItems: 'flex-start',
    height: 23,
    justifyContent: 'center',
  },
});
