import { KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Composer } from '@/components/chat/composer';
import { MessageList } from '@/components/chat/message-list';
import { useChat } from '@/hooks/use-chat';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const { isGenerating, messages, retry, sendMessage, stop } = useChat();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nova</Text>
      </View>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
        style={styles.chat}>
        <MessageList messages={messages} onRetry={retry} />
        <Composer isGenerating={isGenerating} onSend={sendMessage} onStop={stop} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.label,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0,
  },
});
