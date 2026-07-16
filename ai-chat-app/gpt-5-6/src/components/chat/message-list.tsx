import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { ChatMessage } from '@/hooks/use-chat';

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  return (
    <FlatList
      data={messages}
      keyExtractor={(message) => message.id}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={styles.message}>
          <Text style={styles.role}>{item.role === 'user' ? 'You' : 'Nova'}</Text>
          <Text style={styles.body}>{item.content}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: 16,
    gap: 16,
  },
  message: {
    gap: 4,
  },
  role: {
    color: '#6b6b6b',
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 23,
  },
});
