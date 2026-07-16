import type { AssistantMessageStatus, ChatModel, MessageRole } from '@/domain';

export interface Conversation {
  id: string;
  title: string;
  model: ChatModel;
  createdAt: number;
  updatedAt: number;
}

export interface ConversationRow {
  id: string;
  title: string;
  model: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  status: AssistantMessageStatus;
  createdAt: number;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  status: string;
  created_at: number;
}

export interface CreateConversationInput {
  id: string;
  title: string;
  model: ChatModel;
  createdAt: number;
  updatedAt?: number;
}

export interface CreateMessageInput {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  status?: AssistantMessageStatus;
  createdAt: number;
}
