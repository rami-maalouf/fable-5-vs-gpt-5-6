import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardGestureArea, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CHAT_INPUT_NATIVE_ID, Composer } from '@/components/chat/Composer';
import { MessageList } from '@/components/chat/MessageList';
import { useChatStream } from '@/hooks/useChatStream';
import { useChatStore } from '@/state/chat';
import { spacing, useNovaTheme } from '@/theme';

export default function HomeScreen() {
  const theme = useNovaTheme();
  const { bottom } = useSafeAreaInsets();
  const chatStream = useChatStream();
  const activeAssistantMessageId = useChatStore((state) => state.activeAssistantMessageId);
  const appendAssistantChunk = useChatStore((state) => state.appendAssistantChunk);
  const currentModel = useChatStore((state) => state.currentModel);
  const finishAssistantMessage = useChatStore((state) => state.finishAssistantMessage);
  const isAwaitingFirstToken = useChatStore((state) => state.isAwaitingFirstToken);
  const messages = useChatStore((state) => state.messages);
  const startAssistantTurn = useChatStore((state) => state.startAssistantTurn);

  const sendMessage = (content: string) => {
    const turn = startAssistantTurn(content);

    void chatStream.send({
      messages: turn.requestMessages,
      model: currentModel,
      onText: (chunk) => {
        appendAssistantChunk(turn.assistantMessageId, chunk);
      },
    }).then((result) => {
      finishAssistantMessage(turn.assistantMessageId, result.status);
    });
  };

  const stopMessage = () => {
    chatStream.stop();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
          <Pressable
            accessibilityLabel="open conversation history"
            accessibilityRole="button"
            style={[
              styles.iconButton,
              styles.leftHeaderButton,
              { backgroundColor: theme.colors.secondaryFill },
            ]}
          >
            <SymbolView name="sidebar.left" size={21} tintColor={theme.colors.text} />
          </Pressable>

          <View style={styles.titleGroup}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Nova</Text>
            <Text style={[styles.model, { color: theme.colors.secondaryText }]}>
              {currentModel}
            </Text>
          </View>

          <Pressable
            accessibilityLabel="start new chat"
            accessibilityRole="button"
            style={[
              styles.iconButton,
              styles.rightHeaderButton,
              { backgroundColor: theme.colors.secondaryFill },
            ]}
          >
            <SymbolView name="square.and.pencil" size={21} tintColor={theme.colors.text} />
          </Pressable>
        </View>

        <KeyboardGestureArea
          interpolator="ios"
          style={styles.chatArea}
          textInputNativeID={CHAT_INPUT_NATIVE_ID}
        >
          <MessageList
            isAwaitingFirstToken={isAwaitingFirstToken}
            messages={messages}
          />

          <KeyboardStickyView
            collapsable={false}
            offset={{ closed: 0, opened: bottom }}
          >
            <Composer
              isGenerating={chatStream.isStreaming || activeAssistantMessageId != null}
              onSend={sendMessage}
              onStop={stopMessage}
            />
          </KeyboardStickyView>
        </KeyboardGestureArea>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  titleGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  model: {
    fontSize: 12,
    lineHeight: 16,
  },
  iconButton: {
    position: 'absolute',
    top: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftHeaderButton: {
    left: spacing.md,
  },
  rightHeaderButton: {
    right: spacing.md,
  },
});
