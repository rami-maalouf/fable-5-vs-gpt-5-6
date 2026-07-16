import { fetch } from 'expo/fetch';
import Constants from 'expo-constants';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

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

export type { ChatMessage } from '@/lib/chat-state';

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const expoHost = Constants.expoConfig?.hostUri;
const apiOrigin = process.env.EXPO_PUBLIC_API_URL ?? (expoHost ? `http://${expoHost}` : undefined);
const appFetch = Platform.OS === 'web' ? fetch : createAppFetch(fetch, apiOrigin);

export function useChat(model: ChatModel = 'gpt-5.6-luna') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [failedTurn, setFailedTurn] = useState<{
    assistantId: string;
    requestMessages: ChatRequestMessage[];
  } | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const runRequest = useCallback(
    async (requestMessages: ChatRequestMessage[], assistantId: string) => {
      const controller = new AbortController();
      abortController.current = controller;
      setFailedTurn(null);
      setIsGenerating(true);
      let receivedChunk = false;

      try {
        await streamChatResponse({
          messages: requestMessages,
          model,
          signal: controller.signal,
          fetchImpl: appFetch,
          onChunk: (chunk) => {
            receivedChunk = true;
            setMessages((current) => appendAssistantChunk(current, assistantId, chunk));
          },
        });
        setMessages((current) => finishAssistantMessage(current, assistantId));
      } catch {
        if (controller.signal.aborted && !receivedChunk) {
          setMessages((current) => removeAssistantMessage(current, assistantId));
        } else if (controller.signal.aborted) {
          setMessages((current) => finishAssistantMessage(current, assistantId));
        } else if (!controller.signal.aborted) {
          setMessages((current) => failAssistantMessage(current, assistantId));
          setFailedTurn({ assistantId, requestMessages });
        }
      } finally {
        if (abortController.current === controller) {
          abortController.current = null;
          setIsGenerating(false);
        }
      }
    },
    [model],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || abortController.current) {
        return;
      }

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content,
        status: 'complete',
      };
      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: '',
        status: 'pending',
      };
      const settledMessages = settleFailedAssistantMessages(messages);
      const requestMessages = [
        ...toRequestMessages(settledMessages),
        { role: userMessage.role, content: userMessage.content },
      ];

      setMessages([...settledMessages, userMessage, assistantMessage]);
      void runRequest(requestMessages, assistantMessage.id);
    },
    [messages, runRequest],
  );

  const retry = useCallback(() => {
    if (!failedTurn || abortController.current) {
      return;
    }

    setMessages((current) => prepareAssistantRetry(current, failedTurn.assistantId));
    void runRequest(failedTurn.requestMessages, failedTurn.assistantId);
  }, [failedTurn, runRequest]);

  const stop = useCallback(() => {
    abortController.current?.abort();
  }, []);

  return {
    isGenerating,
    messages,
    retry,
    sendMessage,
    stop,
  };
}
