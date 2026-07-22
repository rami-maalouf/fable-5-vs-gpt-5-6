import { fetch } from 'expo/fetch';
import { useCallback, useRef } from 'react';
import { demoReply, isDemoMode } from '@/demo/demo-mode';

export type ChatTurnMessage = { role: 'user' | 'assistant'; content: string };

export type StreamCallbacks = {
  // called with the full assembled text as chunk batches land
  onText: (assembled: string) => void;
};

export type StreamOutcome = 'complete' | 'stopped' | 'error';

export type StreamResult = {
  outcome: StreamOutcome;
  text: string;
  error?: Error;
};

const BATCH_MS = 40;

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

// core stream consumption, isolated from react so it is directly testable.
// aborting the controller cancels the request; the caller persists the
// partial reply as 'stopped'.
export async function streamChat(
  messages: ChatTurnMessage[],
  model: string,
  callbacks: StreamCallbacks,
  controller: AbortController,
): Promise<StreamResult> {
  if (isDemoMode) {
    let demoText = '';
    for (const word of demoReply.split(' ')) {
      if (controller.signal.aborted) return { outcome: 'stopped', text: demoText };
      demoText += `${demoText ? ' ' : ''}${word}`;
      callbacks.onText(demoText);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    return { outcome: 'complete', text: demoText };
  }

  let assembled = '';

  // batch ui updates to ~40ms so long replies stream smoothly instead of
  // re-rendering per token; the first chunk and the final state always emit
  let lastEmit = 0;
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    pendingTimer = null;
    lastEmit = Date.now();
    callbacks.onText(assembled);
  };
  const emit = () => {
    if (pendingTimer !== null) return;
    const elapsed = Date.now() - lastEmit;
    if (elapsed >= BATCH_MS) flush();
    else pendingTimer = setTimeout(flush, BATCH_MS - elapsed);
  };
  const finalFlush = () => {
    if (pendingTimer !== null) clearTimeout(pendingTimer);
    flush();
  };

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
      emit();
    }
    assembled += decoder.decode();
    finalFlush();
    return { outcome: 'complete', text: assembled };
  } catch (e) {
    finalFlush();
    if (controller.signal.aborted) {
      return { outcome: 'stopped', text: assembled };
    }
    return {
      outcome: 'error',
      text: assembled,
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}

// react binding: one in-flight request at a time, stop() aborts it
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
      try {
        return await streamChat(messages, model, callbacks, controller);
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
