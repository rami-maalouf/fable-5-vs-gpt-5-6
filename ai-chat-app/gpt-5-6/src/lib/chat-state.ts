import type { ChatRequestMessage } from '@/lib/chat-stream';

export type ChatMessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export type ChatMessage = ChatRequestMessage & {
  id: string;
  status: ChatMessageStatus;
};

function updateAssistant(
  messages: ChatMessage[],
  assistantId: string,
  update: (message: ChatMessage) => ChatMessage,
) {
  return messages.map((message) => (message.id === assistantId ? update(message) : message));
}

export function appendAssistantChunk(
  messages: ChatMessage[],
  assistantId: string,
  chunk: string,
) {
  return updateAssistant(messages, assistantId, (message) => ({
    ...message,
    content: message.content + chunk,
    status: 'streaming',
  }));
}

export function finishAssistantMessage(messages: ChatMessage[], assistantId: string) {
  return updateAssistant(messages, assistantId, (message) => ({
    ...message,
    status: 'complete',
  }));
}

export function failAssistantMessage(messages: ChatMessage[], assistantId: string) {
  return updateAssistant(messages, assistantId, (message) => ({
    ...message,
    status: 'error',
  }));
}

export function prepareAssistantRetry(messages: ChatMessage[], assistantId: string) {
  return updateAssistant(messages, assistantId, (message) => ({
    ...message,
    content: '',
    status: 'pending',
  }));
}

export function removeAssistantMessage(messages: ChatMessage[], assistantId: string) {
  return messages.filter((message) => message.id !== assistantId);
}

export function settleFailedAssistantMessages(messages: ChatMessage[]) {
  return messages.map((message) =>
    message.status === 'error' ? { ...message, status: 'complete' as const } : message,
  );
}

export function toRequestMessages(messages: ChatMessage[]): ChatRequestMessage[] {
  return messages
    .filter((message) => message.role === 'user' || message.content.length > 0)
    .map(({ role, content }) => ({ role, content }));
}
