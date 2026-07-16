import { useCallback } from 'react';

import { persistAssistantMessage, persistUserTurn } from '@/data/chat-persistence';
import { getDb } from '@/data/client-db';
import { createId } from '@/domain/id';
import type { Message } from '@/domain/messages';
import { useChatStream, type ChatTurnMessage } from '@/hooks/useChatStream';
import { useChatStore } from '@/state/chat-store';

// orchestrates one chat turn: store mutations, sqlite persistence at message
// boundaries (never per token), and the stream lifecycle
export function useSendMessage() {
  const { stream, stop } = useChatStream();

  const send = useCallback(
    async (text: string) => {
      const store = useChatStore.getState();
      if (store.sendState !== 'idle') return;

      const now = Date.now();
      const isNewConversation = store.conversationId === null;
      const conversationId = store.conversationId ?? createId();
      const model = store.model;

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
      if (isNewConversation) {
        store.setConversationId(conversationId);
      }

      try {
        const db = await getDb();
        await persistUserTurn(db, { isNewConversation, model, message: userMessage });
      } catch (e) {
        // persistence must never block the conversation itself
        console.warn('failed to persist user message', e);
      }

      const result = await stream(history, model, {
        onText: (t) => useChatStore.getState().setStreamingText(assistantPlaceholder.id, t),
      });

      useChatStore
        .getState()
        .finishTurn(assistantPlaceholder.id, result.text, result.outcome);

      try {
        const db = await getDb();
        await persistAssistantMessage(db, {
          ...assistantPlaceholder,
          content: result.text,
          status: result.outcome,
          createdAt: Date.now(),
        });
      } catch (e) {
        console.warn('failed to persist assistant message', e);
      }
    },
    [stream],
  );

  return { send, stop };
}
