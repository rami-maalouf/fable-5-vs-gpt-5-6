import { create } from 'zustand';

import type { ChatModel } from '@/domain/model';
import { DEFAULT_CHAT_MODEL } from '@/domain/model';
import type { AssistantMessageStatus, MessageRole } from '@/domain/message';

export type ChatTranscriptMessageStatus = AssistantMessageStatus | 'streaming';

export type ChatTranscriptMessage = {
  content: string;
  createdAt: number;
  id: string;
  role: MessageRole;
  status: ChatTranscriptMessageStatus;
};

export type ChatRequestMessage = {
  content: string;
  role: MessageRole;
};

type AssistantTurn = {
  assistantMessageId: string;
  requestMessages: ChatRequestMessage[];
  userMessageId: string;
};

type ChatState = {
  activeAssistantMessageId: string | null;
  appendAssistantChunk: (assistantMessageId: string, chunk: string) => void;
  currentConversationId: string | null;
  currentModel: ChatModel;
  finishAssistantMessage: (
    assistantMessageId: string,
    status: AssistantMessageStatus,
  ) => void;
  isAwaitingFirstToken: boolean;
  loadConversationTranscript: (input: {
    conversationId: string;
    messages: ChatTranscriptMessage[];
    model: ChatModel;
  }) => void;
  messages: ChatTranscriptMessage[];
  resetTranscript: () => void;
  setCurrentConversationId: (conversationId: string) => void;
  startAssistantTurn: (content: string) => AssistantTurn;
};

let messageCounter = 0;

function createMessageId(role: MessageRole) {
  messageCounter += 1;

  return `${role}-${Date.now()}-${messageCounter}`;
}

function toRequestMessages(messages: ChatTranscriptMessage[]) {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      content: message.content,
      role: message.role,
    }));
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeAssistantMessageId: null,
  currentConversationId: null,
  currentModel: DEFAULT_CHAT_MODEL,
  isAwaitingFirstToken: false,
  messages: [],

  appendAssistantChunk: (assistantMessageId, chunk) => {
    if (chunk.length === 0) {
      return;
    }

    set((state) => ({
      isAwaitingFirstToken:
        state.activeAssistantMessageId === assistantMessageId
          ? false
          : state.isAwaitingFirstToken,
      messages: state.messages.map((message) => {
        if (message.id !== assistantMessageId) {
          return message;
        }

        return {
          ...message,
          content: message.content + chunk,
        };
      }),
    }));
  },

  finishAssistantMessage: (assistantMessageId, status) => {
    set((state) => ({
      activeAssistantMessageId:
        state.activeAssistantMessageId === assistantMessageId
          ? null
          : state.activeAssistantMessageId,
      isAwaitingFirstToken:
        state.activeAssistantMessageId === assistantMessageId
          ? false
          : state.isAwaitingFirstToken,
      messages: state.messages.map((message) => {
        if (message.id !== assistantMessageId) {
          return message;
        }

        return {
          ...message,
          status,
        };
      }),
    }));
  },

  loadConversationTranscript: ({ conversationId, messages, model }) => {
    set({
      activeAssistantMessageId: null,
      currentConversationId: conversationId,
      currentModel: model,
      isAwaitingFirstToken: false,
      messages,
    });
  },

  resetTranscript: () => {
    set({
      activeAssistantMessageId: null,
      currentConversationId: null,
      currentModel: DEFAULT_CHAT_MODEL,
      isAwaitingFirstToken: false,
      messages: [],
    });
  },

  setCurrentConversationId: (conversationId) => {
    set({ currentConversationId: conversationId });
  },

  startAssistantTurn: (content) => {
    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      throw new Error('cannot start an empty assistant turn');
    }

    const now = Date.now();
    const userMessage: ChatTranscriptMessage = {
      content: trimmedContent,
      createdAt: now,
      id: createMessageId('user'),
      role: 'user',
      status: 'complete',
    };
    const assistantMessage: ChatTranscriptMessage = {
      content: '',
      createdAt: now + 1,
      id: createMessageId('assistant'),
      role: 'assistant',
      status: 'streaming',
    };
    const requestMessages = toRequestMessages([...get().messages, userMessage]);

    set((state) => ({
      activeAssistantMessageId: assistantMessage.id,
      isAwaitingFirstToken: true,
      messages: [...state.messages, userMessage, assistantMessage],
    }));

    return {
      assistantMessageId: assistantMessage.id,
      requestMessages,
      userMessageId: userMessage.id,
    };
  },
}));
