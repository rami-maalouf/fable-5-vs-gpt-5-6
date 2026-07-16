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

export type ChatMessage = ChatRequestMessage & {
  id: string;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const expoHost = Constants.expoConfig?.hostUri;
const apiOrigin = process.env.EXPO_PUBLIC_API_URL ?? (expoHost ? `http://${expoHost}` : undefined);
const appFetch = Platform.OS === 'web' ? fetch : createAppFetch(fetch, apiOrigin);

export function useChat(model: ChatModel = 'gpt-5.6-luna') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || abortController.current) {
        return;
      }

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content,
      };
      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: '',
      };
      const requestMessages = [...messages, userMessage];
      const controller = new AbortController();
      abortController.current = controller;
      setMessages([...requestMessages, assistantMessage]);
      setError(null);
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
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: message.content + chunk }
                  : message,
              ),
            );
          },
        });
      } catch (requestError) {
        if (controller.signal.aborted && !receivedChunk) {
          setMessages((current) =>
            current.filter((message) => message.id !== assistantMessage.id),
          );
        } else if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError
              : new Error('The response could not be completed.'),
          );
        }
      } finally {
        if (abortController.current === controller) {
          abortController.current = null;
          setIsGenerating(false);
        }
      }
    },
    [messages, model],
  );

  const stop = useCallback(() => {
    abortController.current?.abort();
  }, []);

  return {
    error,
    isGenerating,
    messages,
    sendMessage,
    stop,
  };
}
