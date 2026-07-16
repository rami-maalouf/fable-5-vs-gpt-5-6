import type { ModelId } from '@/domain/models';

export type Role = 'user' | 'assistant';

// assistant replies can end complete, stopped (user hit stop), or error
// (stream died); user messages are always complete
export type MessageStatus = 'complete' | 'stopped' | 'error';

export type Message = {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  status: MessageStatus;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  model: ModelId | string;
  createdAt: number;
  updatedAt: number;
};
