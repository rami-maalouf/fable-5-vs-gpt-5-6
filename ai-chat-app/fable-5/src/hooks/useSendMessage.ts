import { useCallback } from 'react';

import { persistAssistantMessage, persistUserTurn } from '@/data/chat-persistence';
import { getDb } from '@/data/client-db';
import { deleteMessage } from '@/data/message-repo';
import { createId } from '@/domain/id';
import type { Message } from '@/domain/messages';
import { useChatStream, type ChatTurnMessage } from '@/hooks/useChatStream';
import { useChatStore } from '@/state/chat-store';

function toHistory(messages: Message[]): ChatTurnMessage[] {
  return messages
    .filter((m) => m.content.length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
}

// orchestrates chat turns: store mutations, sqlite persistence at message
// boundaries (never per token), and the stream lifecycle
export function useSendMessage() {
  const { stream, stop } = useChatStream();

  // shared tail of send and retry: stream into a fresh assistant placeholder
  // (already in the store), then finalize + persist it
  const executeTurn = useCallback(
    async (placeholder: Message, history: ChatTurnMessage[], model: string) => {
      const result = await stream(history, model, {
        onText: (t) => useChatStore.getState().setStreamingText(placeholder.id, t),
      });

      useChatStore.getState().finishTurn(placeholder.id, result.text, result.outcome);

      try {
        const db = await getDb();
        await persistAssistantMessage(db, {
          ...placeholder,
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

      const history = toHistory([...store.messages, userMessage]);

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

      await executeTurn(assistantPlaceholder, history, model);
    },
    [executeTurn],
  );

  // re-sends the failed turn: drops the errored reply and streams a new one
  // against the same history (which still ends with the user message)
  const retry = useCallback(async () => {
    const store = useChatStore.getState();
    if (store.sendState !== 'idle') return;
    const last = store.messages[store.messages.length - 1];
    if (!last || last.role !== 'assistant' || last.status !== 'error') return;

    store.removeMessage(last.id);
    try {
      const db = await getDb();
      await deleteMessage(db, last.id);
    } catch (e) {
      console.warn('failed to remove errored message', e);
    }

    const remaining = useChatStore.getState().messages;
    const placeholder: Message = {
      id: createId(),
      conversationId: last.conversationId,
      role: 'assistant',
      content: '',
      status: 'complete',
      createdAt: Date.now(),
    };
    useChatStore.getState().startTurn(null, placeholder);
    await executeTurn(placeholder, toHistory(remaining), useChatStore.getState().model);
  }, [executeTurn]);

  return { send, stop, retry };
}
