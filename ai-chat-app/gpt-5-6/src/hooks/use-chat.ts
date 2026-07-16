import { fetch } from 'expo/fetch';
import Constants from 'expo-constants';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { createConversationTitle, restoreChatMessages } from '@/lib/chat-persistence';
import {
  createAppFetch,
  streamChatResponse,
  type ChatModel,
  type ChatRequestMessage,
} from '@/lib/chat-stream';
import {
  appendAssistantChunk,
  failAssistantMessage,
  finishAssistantMessage,
  prepareAssistantRetry,
  removeAssistantMessage,
  settleFailedAssistantMessages,
  toRequestMessages,
  type ChatMessage,
} from '@/lib/chat-state';
import {
  createConversationWithFirstMessage,
  getConversation,
  getDatabase,
  insertMessage,
  insertMessages,
  listMessages,
  updateConversationModel,
} from '@/lib/db';
import { createTextBatcher } from '@/lib/text-batcher';

export type { ChatMessage } from '@/lib/chat-state';

type RetryTurn = {
  assistantId: string;
  conversationId: string;
  requestMessages: ChatRequestMessage[];
  prepare?: () => Promise<void>;
};

function createEntityId(prefix: 'conversation' | 'message') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const expoHost = Constants.expoConfig?.hostUri;
const apiOrigin = process.env.EXPO_PUBLIC_API_URL ?? (expoHost ? `http://${expoHost}` : undefined);
const appFetch = Platform.OS === 'web' ? fetch : createAppFetch(fetch, apiOrigin);

export function useChat(initialModel: ChatModel = 'gpt-5.6-luna') {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [model, setModel] = useState<ChatModel>(initialModel);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [failedTurn, setFailedTurn] = useState<RetryTurn | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const sessionVersion = useRef(0);

  const persistAssistant = useCallback(
    async (conversationId: string, assistantId: string, content: string) => {
      if (!content) {
        return;
      }

      const database = await getDatabase();
      await insertMessage(database, {
        id: assistantId,
        conversationId,
        role: 'assistant',
        content,
      });
    },
    [],
  );

  const runRequest = useCallback(
    async (turn: RetryTurn) => {
      const controller = new AbortController();
      const requestSession = sessionVersion.current;
      abortController.current = controller;
      setFailedTurn(null);
      setIsGenerating(true);
      let receivedContent = '';
      let retryPreparation = turn.prepare;

      const updateCurrentMessages = (update: (current: ChatMessage[]) => ChatMessage[]) => {
        if (sessionVersion.current === requestSession) {
          setMessages(update);
        }
      };
      const textBatcher = createTextBatcher((text) => {
        updateCurrentMessages((current) =>
          appendAssistantChunk(current, turn.assistantId, text),
        );
      });

      try {
        if (turn.prepare) {
          await turn.prepare();
          retryPreparation = undefined;
        }

        if (controller.signal.aborted) {
          throw new DOMException('The request was stopped.', 'AbortError');
        }

        await streamChatResponse({
          messages: turn.requestMessages,
          model,
          signal: controller.signal,
          fetchImpl: appFetch,
          onChunk: (chunk) => {
            receivedContent += chunk;
            textBatcher.push(chunk);
          },
        });
        textBatcher.flush();
        updateCurrentMessages((current) =>
          finishAssistantMessage(current, turn.assistantId),
        );
        await persistAssistant(turn.conversationId, turn.assistantId, receivedContent);
      } catch {
        textBatcher.flush();
        if (controller.signal.aborted && !receivedContent) {
          updateCurrentMessages((current) =>
            removeAssistantMessage(current, turn.assistantId),
          );
        } else if (controller.signal.aborted) {
          updateCurrentMessages((current) =>
            finishAssistantMessage(current, turn.assistantId),
          );

          try {
            await persistAssistant(turn.conversationId, turn.assistantId, receivedContent);
          } catch {
            updateCurrentMessages((current) =>
              failAssistantMessage(current, turn.assistantId),
            );
            if (sessionVersion.current === requestSession) {
              setFailedTurn({ ...turn, prepare: undefined });
            }
          }
        } else if (sessionVersion.current === requestSession) {
          setMessages((current) => failAssistantMessage(current, turn.assistantId));
          setFailedTurn({ ...turn, prepare: retryPreparation });
        }
      } finally {
        if (abortController.current === controller) {
          abortController.current = null;
          if (sessionVersion.current === requestSession) {
            setIsGenerating(false);
          }
        }
      }
    },
    [model, persistAssistant],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || abortController.current) {
        return;
      }

      const timestamp = Date.now();
      const conversationId = activeConversationId ?? createEntityId('conversation');
      const isFirstMessage = !activeConversationId;
      const userMessage: ChatMessage = {
        id: createEntityId('message'),
        role: 'user',
        content,
        status: 'complete',
      };
      const assistantMessage: ChatMessage = {
        id: createEntityId('message'),
        role: 'assistant',
        content: '',
        status: 'pending',
      };
      const settledMessages = settleFailedAssistantMessages(messages);
      const failedAssistant = messages
        .filter(
          (message) =>
            message.role === 'assistant' && message.status === 'error' && message.content,
        )
        .at(-1);
      const requestMessages = [
        ...toRequestMessages(settledMessages),
        { role: userMessage.role, content: userMessage.content },
      ];
      let pendingPriorPreparation = failedTurn?.prepare;
      const prepare = async () => {
        const database = await getDatabase();
        if (isFirstMessage) {
          await createConversationWithFirstMessage(
            database,
            {
              id: conversationId,
              title: createConversationTitle(content),
              model,
              timestamp,
            },
            {
              id: userMessage.id,
              conversationId,
              role: 'user',
              content: userMessage.content,
              createdAt: timestamp,
            },
          );
          return;
        }

        if (pendingPriorPreparation) {
          await pendingPriorPreparation();
          pendingPriorPreparation = undefined;
        }

        await insertMessages(database, [
          ...(failedAssistant
            ? [
                {
                  id: failedAssistant.id,
                  conversationId,
                  role: failedAssistant.role,
                  content: failedAssistant.content,
                  createdAt: timestamp - 1,
                } as const,
              ]
            : []),
          {
            id: userMessage.id,
            conversationId,
            role: userMessage.role,
            content: userMessage.content,
            createdAt: timestamp,
          },
        ]);
      };

      if (isFirstMessage) {
        setActiveConversationId(conversationId);
      }
      setMessages([...settledMessages, userMessage, assistantMessage]);
      void runRequest({
        assistantId: assistantMessage.id,
        conversationId,
        requestMessages,
        prepare,
      });
    },
    [activeConversationId, failedTurn, messages, model, runRequest],
  );

  const retry = useCallback(() => {
    if (!failedTurn || abortController.current) {
      return;
    }

    setMessages((current) => prepareAssistantRetry(current, failedTurn.assistantId));
    void runRequest(failedTurn);
  }, [failedTurn, runRequest]);

  const stop = useCallback(() => {
    abortController.current?.abort();
  }, []);

  const startNewChat = useCallback(() => {
    sessionVersion.current += 1;
    abortController.current?.abort();
    abortController.current = null;
    setActiveConversationId(null);
    setFailedTurn(null);
    setIsGenerating(false);
    setMessages([]);
    setModel(initialModel);
  }, [initialModel]);

  const openConversation = useCallback(
    async (conversationId: string) => {
      const loadSession = sessionVersion.current + 1;
      sessionVersion.current = loadSession;
      abortController.current?.abort();
      abortController.current = null;
      setFailedTurn(null);
      setIsGenerating(false);

      const database = await getDatabase();
      const [conversation, records] = await Promise.all([
        getConversation(database, conversationId),
        listMessages(database, conversationId),
      ]);

      if (sessionVersion.current !== loadSession) {
        return false;
      }

      if (!conversation) {
        setActiveConversationId(null);
        setMessages([]);
        setModel(initialModel);
        return false;
      }

      setActiveConversationId(conversation.id);
      setMessages(restoreChatMessages(records));
      setModel(conversation.model);
      return true;
    },
    [initialModel],
  );

  const selectModel = useCallback(
    async (nextModel: ChatModel) => {
      if (abortController.current || nextModel === model) {
        return nextModel === model;
      }

      const selectionSession = sessionVersion.current;
      if (activeConversationId) {
        try {
          const database = await getDatabase();
          await updateConversationModel(database, activeConversationId, nextModel);
        } catch {
          return false;
        }

        if (sessionVersion.current !== selectionSession) {
          return false;
        }
      }

      setModel(nextModel);
      return true;
    },
    [activeConversationId, model],
  );

  return {
    activeConversationId,
    isGenerating,
    messages,
    model,
    openConversation,
    retry,
    selectModel,
    sendMessage,
    startNewChat,
    stop,
  };
}
