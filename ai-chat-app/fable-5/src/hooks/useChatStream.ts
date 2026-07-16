import { fetch } from 'expo/fetch';
import { useCallback, useRef } from 'react';

export type ChatTurnMessage = { role: 'user' | 'assistant'; content: string };

export type StreamCallbacks = {
  // called with the full assembled text every time a chunk batch lands
  onText: (assembled: string) => void;
};

export type StreamOutcome = 'complete' | 'stopped' | 'error';

export type StreamResult = {
  outcome: StreamOutcome;
  text: string;
  error?: Error;
};

// expo-router points window.location at the dev server (or the configured
// production origin). expo/fetch's own relative resolution has proven
// unreliable when the packager port is non-default, so resolve explicitly
// against window.location - still no hardcoded origin anywhere.
function chatUrl(): string {
  if (typeof window !== 'undefined' && window.location?.href) {
    return new URL('/chat', window.location.href).toString();
  }
  return '/chat';
}

// stream consumption is isolated in this hook; ui components never touch fetch.
// stop() aborts the request; the caller persists the partial reply as 'stopped'.
export function useChatStream() {
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const stream = useCallback(
    async (
      messages: ChatTurnMessage[],
      model: string,
      callbacks: StreamCallbacks,
    ): Promise<StreamResult> => {
      const controller = new AbortController();
      abortRef.current = controller;
      let assembled = '';

      try {
        const response = await fetch(chatUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, model }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          return {
            outcome: 'error',
            text: assembled,
            error: new Error(`request failed (${response.status})`),
          };
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assembled += decoder.decode(value, { stream: true });
          callbacks.onText(assembled);
        }
        assembled += decoder.decode();
        callbacks.onText(assembled);
        return { outcome: 'complete', text: assembled };
      } catch (e) {
        if (controller.signal.aborted) {
          return { outcome: 'stopped', text: assembled };
        }
        return {
          outcome: 'error',
          text: assembled,
          error: e instanceof Error ? e : new Error(String(e)),
        };
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [],
  );

  return { stream, stop };
}
