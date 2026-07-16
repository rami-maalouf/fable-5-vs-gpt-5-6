export type MessageRole = 'user' | 'assistant';

export type AssistantMessageStatus = 'complete' | 'stopped' | 'error';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  status: AssistantMessageStatus;
  createdAt: number;
}
