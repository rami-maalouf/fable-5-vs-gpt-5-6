import { useMemo, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardGestureArea, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CHAT_INPUT_NATIVE_ID, Composer } from '@/components/chat/Composer';
import { MessageList } from '@/components/chat/MessageList';
import { ConversationDrawerContent } from '@/components/drawer/ConversationDrawerContent';
import { Drawer } from '@/components/drawer/Drawer';
import {
  createExpoSqlDatabaseAdapter,
  deleteConversationAsync,
  renameConversationAsync,
} from '@/data';
import { useChatStream } from '@/hooks/useChatStream';
import { useChatStore } from '@/state/chat';
import { useDrawerStore } from '@/state/drawer';
import {
  loadConversationTranscriptAsync,
  persistAssistantMessageContentAsync,
  persistAssistantMessageStatusAsync,
  persistAssistantTurnStartAsync,
} from '@/state/chat-persistence';
import { spacing, useNovaTheme } from '@/theme';

export default function HomeScreen() {
  const theme = useNovaTheme();
  const { bottom } = useSafeAreaInsets();
  const sqliteDb = useSQLiteContext();
  const db = useMemo(() => createExpoSqlDatabaseAdapter(sqliteDb), [sqliteDb]);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);
  const chatStream = useChatStream();
  const activeAssistantMessageId = useChatStore((state) => state.activeAssistantMessageId);
  const appendAssistantChunk = useChatStore((state) => state.appendAssistantChunk);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const currentModel = useChatStore((state) => state.currentModel);
  const finishAssistantMessage = useChatStore((state) => state.finishAssistantMessage);
  const isAwaitingFirstToken = useChatStore((state) => state.isAwaitingFirstToken);
  const messages = useChatStore((state) => state.messages);
  const loadConversationTranscript = useChatStore((state) => state.loadConversationTranscript);
  const resetTranscript = useChatStore((state) => state.resetTranscript);
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);
  const startAssistantTurn = useChatStore((state) => state.startAssistantTurn);
  const isDrawerOpen = useDrawerStore((state) => state.isOpen);
  const openDrawer = useDrawerStore((state) => state.openDrawer);
  const setDrawerOpen = useDrawerStore((state) => state.setDrawerOpen);

  const sendMessage = (content: string) => {
    const turn = startAssistantTurn(content);
    const userMessage = useChatStore
      .getState()
      .messages.find((message) => message.id === turn.userMessageId);
    const assistantMessage = useChatStore
      .getState()
      .messages.find((message) => message.id === turn.assistantMessageId);

    if (userMessage == null || assistantMessage == null) {
      finishAssistantMessage(turn.assistantMessageId, 'error');
      return;
    }

    let assistantWriteQueue = Promise.resolve();
    const enqueueAssistantWrite = (contentToPersist: string) => {
      assistantWriteQueue = assistantWriteQueue.then(() => (
        persistAssistantMessageContentAsync(db, {
          assistantMessageId: turn.assistantMessageId,
          content: contentToPersist,
          updatedAt: Date.now(),
        })
      ));
      void assistantWriteQueue.catch(() => undefined);
    };

    void persistAssistantTurnStartAsync(db, {
      assistantMessage,
      conversationId: currentConversationId,
      model: currentModel,
      userMessage,
    })
      .then(async ({ conversationId }) => {
        setCurrentConversationId(conversationId);

        const result = await chatStream.send({
          messages: turn.requestMessages,
          model: currentModel,
          onText: (chunk) => {
            appendAssistantChunk(turn.assistantMessageId, chunk);

            const latestAssistantMessage = useChatStore
              .getState()
              .messages.find((message) => message.id === turn.assistantMessageId);

            enqueueAssistantWrite(latestAssistantMessage?.content ?? '');
          },
        });
        const latestAssistantMessage = useChatStore
          .getState()
          .messages.find((message) => message.id === turn.assistantMessageId);

        finishAssistantMessage(turn.assistantMessageId, result.status);

        await assistantWriteQueue.catch(() => undefined);
        await persistAssistantMessageStatusAsync(db, {
          assistantMessageId: turn.assistantMessageId,
          content: latestAssistantMessage?.content ?? '',
          status: result.status,
          updatedAt: Date.now(),
        });
      })
      .catch(() => {
        finishAssistantMessage(turn.assistantMessageId, 'error');
      });
  };

  const stopMessage = () => {
    chatStream.stop();
  };

  const refreshDrawerConversations = () => {
    setDrawerRefreshKey((value) => value + 1);
  };

  const startNewChat = () => {
    chatStream.stop();
    resetTranscript();
    setDrawerOpen(false);
  };

  const selectConversation = (conversationId: string) => {
    chatStream.stop();

    void loadConversationTranscriptAsync(db, conversationId).then(({ conversation, messages }) => {
      loadConversationTranscript({
        conversationId: conversation.id,
        messages,
        model: conversation.model,
      });
      setDrawerOpen(false);
    });
  };

  const renameConversation = (conversationId: string, title: string) => {
    Alert.prompt(
      'Rename conversation',
      undefined,
      [
        {
          style: 'cancel',
          text: 'Cancel',
        },
        {
          onPress: (nextTitle?: string) => {
            const trimmedTitle = nextTitle?.trim();

            if (trimmedTitle == null || trimmedTitle.length === 0) {
              return;
            }

            void renameConversationAsync(
              db,
              conversationId,
              trimmedTitle,
              Date.now()
            ).then(refreshDrawerConversations);
          },
          text: 'Save',
        },
      ],
      'plain-text',
      title
    );
  };

  const deleteConversation = (conversationId: string, title: string) => {
    Alert.alert(
      'Delete conversation?',
      title,
      [
        {
          style: 'cancel',
          text: 'Cancel',
        },
        {
          onPress: () => {
            void deleteConversationAsync(db, conversationId).then(() => {
              if (conversationId === currentConversationId) {
                resetTranscript();
                setDrawerOpen(false);
              }

              refreshDrawerConversations();
            });
          },
          style: 'destructive',
          text: 'Delete',
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView
        accessibilityElementsHidden={isDrawerOpen}
        edges={['top', 'bottom']}
        importantForAccessibility={isDrawerOpen ? 'no-hide-descendants' : 'auto'}
        style={styles.safeArea}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
          <Pressable
            accessibilityLabel="open conversation history"
            accessibilityRole="button"
            onPress={openDrawer}
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
            onPress={startNewChat}
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

      <Drawer isOpen={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <ConversationDrawerContent
          activeConversationId={currentConversationId}
          db={db}
          isOpen={isDrawerOpen}
          onDeleteConversation={deleteConversation}
          onNewChat={startNewChat}
          onRenameConversation={renameConversation}
          onSelectConversation={selectConversation}
          refreshKey={drawerRefreshKey}
        />
      </Drawer>
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
