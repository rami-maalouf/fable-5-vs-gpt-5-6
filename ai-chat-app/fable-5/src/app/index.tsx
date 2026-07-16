import { SymbolView } from 'expo-symbols';
import { Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Composer } from '@/components/chat/Composer';
import { MessageList } from '@/components/chat/MessageList';
import { ModelPicker } from '@/components/chat/ModelPicker';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useChatStore } from '@/state/chat-store';
import { useDrawerStore } from '@/state/drawer-store';
import { colors, spacing } from '@/theme/tokens';

function HeaderButton({
  symbol,
  label,
  onPress,
}: {
  symbol: 'sidebar.left' | 'square.and.pencil';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}>
      <SymbolView name={symbol} size={22} tintColor={colors.label} fallback={null} />
    </Pressable>
  );
}

export default function ChatScreen() {
  const messages = useChatStore((s) => s.messages);
  const sendState = useChatStore((s) => s.sendState);
  const streamingMessageId = useChatStore((s) => s.streamingMessageId);
  const { send, stop, retry } = useSendMessage();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const openDrawer = useCallback(() => useDrawerStore.getState().setOpen(true), []);
  const newChat = useCallback(() => useChatStore.getState().reset(), []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Nova',
          headerShadowVisible: false,
          headerTitle: () => <ModelPicker />,
          headerLeft: () => (
            <HeaderButton symbol="sidebar.left" label="Open sidebar" onPress={openDrawer} />
          ),
          headerRight: () => (
            <HeaderButton symbol="square.and.pencil" label="New chat" onPress={newChat} />
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.avoider}
        behavior="translate-with-padding"
        keyboardVerticalOffset={headerHeight}
      >
        <MessageList
          messages={messages}
          sendState={sendState}
          streamingMessageId={streamingMessageId}
          onRetry={retry}
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
