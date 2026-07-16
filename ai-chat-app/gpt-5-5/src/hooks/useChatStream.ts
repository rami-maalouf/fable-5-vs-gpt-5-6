import Constants from 'expo-constants';
import { fetch } from 'expo/fetch';
import { useCallback, useRef, useState } from 'react';

import { DEFAULT_CHAT_MODEL, type ChatModel } from '@/domain/model';

type ChatStreamMessage = {
  content: string;
  role: 'assistant' | 'user';
};

type SendChatStreamOptions = {
  messages: ChatStreamMessage[];
  model?: ChatModel;
  onText?: (text: string) => void;
};

type SendChatStreamResult = {
  error?: string;
  status: 'complete' | 'error' | 'stopped';
};

type ConsumeTextStreamOptions = {
  flushIntervalMs?: number;
  onText: (text: string) => void;
};

const DEFAULT_STREAM_FLUSH_INTERVAL_MS = 40;

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

export async function consumeTextStream(
  stream: ReadableStream<Uint8Array>,
  {
    flushIntervalMs = DEFAULT_STREAM_FLUSH_INTERVAL_MS,
    onText,
  }: ConsumeTextStreamOptions,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let assembledText = '';
  let pendingText = '';
  let flushTimeout: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    flushTimeout = null;

    if (pendingText.length === 0) {
      return;
    }

    const text = pendingText;
    pendingText = '';
    assembledText += text;
    onText(text);
  };

  const scheduleFlush = () => {
    if (flushTimeout != null) {
      return;
    }

    flushTimeout = setTimeout(flush, flushIntervalMs);
  };

  try {
    while (true) {
      const result = await reader.read();

      if (result.done) {
        pendingText += decoder.decode();
        break;
      }

      pendingText += decoder.decode(result.value, { stream: true });
      scheduleFlush();
    }
  } finally {
    if (flushTimeout != null) {
      clearTimeout(flushTimeout);
    }

    flush();
    reader.releaseLock();
  }

  return assembledText;
}

export function useChatStream() {
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [text, setText] = useState('');

  const send = useCallback(async ({
    messages,
    model = DEFAULT_CHAT_MODEL,
    onText,
  }: SendChatStreamOptions): Promise<SendChatStreamResult> => {
    const abortController = new AbortController();
    abortRef.current = abortController;
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
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`chat request failed with status ${response.status}`);
      }

      if (response.body == null) {
        throw new Error('chat response did not include a stream');
      }

      await consumeTextStream(response.body, {
        onText: (chunk) => {
          setText((current) => current + chunk);
          onText?.(chunk);
        },
      });

      return {
        status: 'complete',
      };
    } catch (streamError) {
      if (abortController.signal.aborted) {
        return {
          status: 'stopped',
        };
      }

      const message = streamError instanceof Error ? streamError.message : 'chat stream failed';
      setError(message);

      return {
        error: message,
        status: 'error',
      };
    } finally {
      if (abortRef.current === abortController) {
        abortRef.current = null;
      }

      setIsStreaming(false);
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    error,
    isStreaming,
    send,
    stop,
    text,
  };
}
