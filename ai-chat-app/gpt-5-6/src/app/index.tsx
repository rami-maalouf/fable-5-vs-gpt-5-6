import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Composer } from '@/components/chat/composer';
import { MessageList } from '@/components/chat/message-list';
import { useChat } from '@/hooks/use-chat';

export default function HomeScreen() {
  const { isGenerating, messages, sendMessage, stop } = useChat();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nova</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chat}>
        <MessageList messages={messages} />
        <Composer isGenerating={isGenerating} onSend={sendMessage} onStop={stop} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  chat: {
    flex: 1,
  },
  title: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '600',
  },
});
