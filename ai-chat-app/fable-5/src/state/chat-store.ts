import { create } from 'zustand';

import type { Conversation, Message, MessageStatus } from '@/domain/messages';
import { DEFAULT_MODEL } from '@/domain/models';

export type SendState = 'idle' | 'awaiting' | 'streaming';

type ChatStore = {
  // null until the first message is persisted (fresh-launch rule)
  conversationId: string | null;
  model: string;
  messages: Message[];
  sendState: SendState;
  streamingMessageId: string | null;

  startTurn: (userMessage: Message, assistantPlaceholder: Message) => void;
  setStreamingText: (id: string, text: string) => void;
  finishTurn: (id: string, content: string, status: MessageStatus) => void;
  setConversationId: (id: string) => void;
  setModel: (model: string) => void;
  reset: () => void;
  loadConversation: (conversation: Conversation, messages: Message[]) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  conversationId: null,
  model: DEFAULT_MODEL,
  messages: [],
  sendState: 'idle',
  streamingMessageId: null,

  startTurn: (userMessage, assistantPlaceholder) =>
    set((s) => ({
      messages: [...s.messages, userMessage, assistantPlaceholder],
      sendState: 'awaiting',
      streamingMessageId: assistantPlaceholder.id,
    })),

  setStreamingText: (id, text) =>
    set((s) => ({
      sendState: 'streaming',
      messages: s.messages.map((m) => (m.id === id ? { ...m, content: text } : m)),
    })),

  finishTurn: (id, content, status) =>
    set((s) => ({
      sendState: 'idle',
      streamingMessageId: null,
      messages: s.messages.map((m) => (m.id === id ? { ...m, content, status } : m)),
    })),

  setConversationId: (id) => set({ conversationId: id }),

  setModel: (model) => set({ model }),

  // note: model is intentionally untouched - a new chat keeps the last
  // chosen model, like the chatgpt app
  reset: () =>
    set({
      conversationId: null,
      messages: [],
      sendState: 'idle',
      streamingMessageId: null,
    }),

  loadConversation: (conversation, messages) =>
    set({
      conversationId: conversation.id,
      model: conversation.model,
      messages,
      sendState: 'idle',
      streamingMessageId: null,
    }),
}));
