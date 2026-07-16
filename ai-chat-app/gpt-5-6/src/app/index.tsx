import { SymbolView } from 'expo-symbols';
import { KeyboardAvoidingView, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Composer } from '@/components/chat/composer';
import { MessageList } from '@/components/chat/message-list';
import { DrawerShell } from '@/components/drawer/drawer-shell';
import { useChat } from '@/hooks/use-chat';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const {
    activeConversationId,
    isGenerating,
    messages,
    retry,
    sendMessage,
    stop,
  } = useChat();

  return (
    <DrawerShell>
      {({ openDrawer }) => (
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Nova</Text>
          </View>
          <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.menuPosition}>
            <Pressable
              accessibilityLabel="Open conversations"
              accessibilityRole="button"
              hitSlop={4}
              onPress={openDrawer}
              style={styles.menuButton}>
              <SymbolView
                name="sidebar.left"
                size={21}
                tintColor={colors.label as string}
              />
            </Pressable>
          </SafeAreaView>
          <KeyboardAvoidingView
            behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
            style={styles.chat}>
            <MessageList
              conversationId={activeConversationId}
              messages={messages}
              onRetry={retry}
            />
            <Composer isGenerating={isGenerating} onSend={sendMessage} onStop={stop} />
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </DrawerShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chat: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  menuButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  menuPosition: {
    left: 8,
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  title: {
    color: colors.label,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0,
  },
});
