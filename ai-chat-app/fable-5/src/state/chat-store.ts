import { create } from 'zustand';

import type { Conversation, Message, MessageStatus } from '@/domain/messages';
import { DEFAULT_MODEL, isAllowedModel } from '@/domain/models';
import { createDemoMessages, demoConversationId, isDemoMode } from '@/demo/demo-mode';

export type SendState = 'idle' | 'awaiting' | 'streaming';

type ChatStore = {
  // null until the first message is persisted (fresh-launch rule)
  conversationId: string | null;
  model: string;
  messages: Message[];
  sendState: SendState;
  streamingMessageId: string | null;

  // userMessage is null when retrying a failed turn (the user message is
  // already in the history)
  startTurn: (userMessage: Message | null, assistantPlaceholder: Message) => void;
  setStreamingText: (id: string, text: string) => void;
  finishTurn: (id: string, content: string, status: MessageStatus) => void;
  removeMessage: (id: string) => void;
  setConversationId: (id: string) => void;
  setModel: (model: string) => void;
  reset: () => void;
  loadConversation: (conversation: Conversation, messages: Message[]) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  conversationId: isDemoMode ? demoConversationId : null,
  model: DEFAULT_MODEL,
  messages: isDemoMode ? createDemoMessages() : [],
  sendState: 'idle',
  streamingMessageId: null,

  startTurn: (userMessage, assistantPlaceholder) =>
    set((s) => ({
      messages: userMessage
        ? [...s.messages, userMessage, assistantPlaceholder]
        : [...s.messages, assistantPlaceholder],
      sendState: 'awaiting',
      streamingMessageId: assistantPlaceholder.id,
    })),

  removeMessage: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

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

  // the allowlist is enforced client-side too: an off-list value can never
  // become request payload
  setModel: (model) => {
    if (isAllowedModel(model)) set({ model });
  },

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
