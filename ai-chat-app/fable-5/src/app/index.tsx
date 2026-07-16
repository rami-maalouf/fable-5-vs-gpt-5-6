import { Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Composer } from '@/components/chat/Composer';
import { MessageList } from '@/components/chat/MessageList';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useChatStore } from '@/state/chat-store';
import { colors, spacing } from '@/theme/tokens';

export default function ChatScreen() {
  const messages = useChatStore((s) => s.messages);
  const sendState = useChatStore((s) => s.sendState);
  const streamingMessageId = useChatStore((s) => s.streamingMessageId);
  const { send, stop } = useSendMessage();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Nova', headerShadowVisible: false }} />
      <KeyboardAvoidingView
        style={styles.avoider}
        behavior="translate-with-padding"
        keyboardVerticalOffset={headerHeight}
      >
        <MessageList
          messages={messages}
          sendState={sendState}
          streamingMessageId={streamingMessageId}
        />
        <View style={{ paddingBottom: Math.max(insets.bottom, spacing.sm) }}>
          <Composer generating={sendState !== 'idle'} onSend={send} onStop={stop} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  avoider: {
    flex: 1,
  },
});
