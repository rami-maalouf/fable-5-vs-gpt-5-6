import { assertChatModel } from '@/domain';
import type { AssistantMessageStatus, MessageRole } from '@/domain';

import type { Conversation, ConversationRow, Message, MessageRow } from './types';

function assertMessageRole(value: string): MessageRole {
  if (value === 'user' || value === 'assistant') {
    return value;
  }

  throw new Error(`unsupported message role: ${value}`);
}

function assertAssistantStatus(value: string): AssistantMessageStatus {
  if (value === 'complete' || value === 'stopped' || value === 'error') {
    return value;
  }

  throw new Error(`unsupported message status: ${value}`);
}

export function mapConversationRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    model: assertChatModel(row.model),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: assertMessageRole(row.role),
    content: row.content,
    status: assertAssistantStatus(row.status),
    createdAt: row.created_at,
  };
}
