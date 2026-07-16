import { useCallback } from 'react';

import { createId } from '@/domain/id';
import type { Message } from '@/domain/messages';
import { useChatStream, type ChatTurnMessage } from '@/hooks/useChatStream';
import { useChatStore } from '@/state/chat-store';

// orchestrates one chat turn: store mutations + the stream lifecycle.
// persistence hooks in here in a later task.
export function useSendMessage() {
  const { stream, stop } = useChatStream();

  const send = useCallback(
    async (text: string) => {
      const store = useChatStore.getState();
      if (store.sendState !== 'idle') return;

      const now = Date.now();
      const conversationId = store.conversationId ?? '';
      const userMessage: Message = {
        id: createId(),
        conversationId,
        role: 'user',
        content: text,
        status: 'complete',
        createdAt: now,
      };
      const assistantPlaceholder: Message = {
        id: createId(),
        conversationId,
        role: 'assistant',
        content: '',
        status: 'complete',
        createdAt: now + 1,
      };

      const history: ChatTurnMessage[] = [...store.messages, userMessage]
        .filter((m) => m.content.length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      store.startTurn(userMessage, assistantPlaceholder);

      const result = await stream(history, store.model, {
        onText: (t) => useChatStore.getState().setStreamingText(assistantPlaceholder.id, t),
      });

      useChatStore
        .getState()
        .finishTurn(assistantPlaceholder.id, result.text, result.outcome);
    },
    [stream],
  );

  return { send, stop };
}
