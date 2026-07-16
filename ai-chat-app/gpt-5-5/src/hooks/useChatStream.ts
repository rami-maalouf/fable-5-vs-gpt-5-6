import Constants from 'expo-constants';
import { fetch } from 'expo/fetch';
import { useCallback, useState } from 'react';

import { DEFAULT_CHAT_MODEL, type ChatModel } from '@/domain/model';

type ChatStreamMessage = {
  content: string;
  role: 'assistant' | 'user';
};

type SendChatStreamOptions = {
  messages: ChatStreamMessage[];
  model?: ChatModel;
};

function getChatRouteUrl(path: '/chat') {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.platform?.hostUri;

  if (hostUri != null) {
    return `http://${hostUri}${path}`;
  }

  const devServerOrigin = getDevServerOriginFromUrl(Constants.linkingUri)
    ?? getDevServerOriginFromUrl(Constants.experienceUrl);

  if (devServerOrigin != null) {
    return `${devServerOrigin}${path}`;
  }

  if (__DEV__) {
    return `http://localhost:8097${path}`;
  }

  return path;
}

function getDevServerOriginFromUrl(value: string | undefined) {
  if (value == null || value.length === 0) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.origin;
    }

    const nestedUrl = url.searchParams.get('url');

    if (nestedUrl == null) {
      return null;
    }

    return new URL(nestedUrl).origin;
  } catch {
    return null;
  }
}

export function useChatStream() {
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [text, setText] = useState('');

  const send = useCallback(async ({ messages, model = DEFAULT_CHAT_MODEL }: SendChatStreamOptions) => {
    setError(null);
    setIsStreaming(true);
    setText('');

    try {
      const response = await fetch(getChatRouteUrl('/chat'), {
        body: JSON.stringify({ messages, model }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`chat request failed with status ${response.status}`);
      }

      if (response.body == null) {
        throw new Error('chat response did not include a stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const result = await reader.read();

        if (result.done) {
          setText((current) => current + decoder.decode());
          break;
        }

        setText((current) => current + decoder.decode(result.value, { stream: true }));
      }
    } catch (streamError) {
      setError(streamError instanceof Error ? streamError.message : 'chat stream failed');
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return {
    error,
    isStreaming,
    send,
    text,
  };
}
