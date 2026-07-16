import {
  createConversationAsync,
  createMessageAsync,
  getConversationAsync,
  listMessagesAsync,
  updateAssistantMessageAsync,
} from '@/data';
import type { Conversation, SqlDatabase } from '@/data';
import type { AssistantMessageStatus, ChatModel } from '@/domain';
import { deriveConversationTitle } from '@/domain';
import type { ChatTranscriptMessage } from '@/state/chat';

type PersistAssistantTurnStartInput = {
  assistantMessage: ChatTranscriptMessage;
  conversationId: string | null;
  model: ChatModel;
  userMessage: ChatTranscriptMessage;
};

type PersistAssistantContentInput = {
  assistantMessageId: string;
  content: string;
  updatedAt: number;
};

type PersistAssistantStatusInput = PersistAssistantContentInput & {
  status: AssistantMessageStatus;
};

type LoadedConversationTranscript = {
  conversation: Conversation;
  messages: ChatTranscriptMessage[];
};

let conversationCounter = 0;

function createConversationId() {
  conversationCounter += 1;

  return `conversation-${Date.now()}-${conversationCounter}`;
}

function toTranscriptMessage(message: Awaited<ReturnType<typeof listMessagesAsync>>[number]) {
  return {
    content: message.content,
    createdAt: message.createdAt,
    id: message.id,
    role: message.role,
    status: message.status,
  } satisfies ChatTranscriptMessage;
}

export async function persistAssistantTurnStartAsync(
  db: SqlDatabase,
  input: PersistAssistantTurnStartInput
) {
  const conversationId = input.conversationId ?? createConversationId();

  if (input.conversationId == null) {
    await createConversationAsync(db, {
      createdAt: input.userMessage.createdAt,
      id: conversationId,
      model: input.model,
      title: deriveConversationTitle(input.userMessage.content),
      updatedAt: input.assistantMessage.createdAt,
    });
  }

  await createMessageAsync(db, {
    content: input.userMessage.content,
    conversationId,
    createdAt: input.userMessage.createdAt,
    id: input.userMessage.id,
    role: 'user',
    status: 'complete',
  });
  await createMessageAsync(db, {
    content: input.assistantMessage.content,
    conversationId,
    createdAt: input.assistantMessage.createdAt,
    id: input.assistantMessage.id,
    role: 'assistant',
    status: 'stopped',
  });

  return { conversationId };
}

export async function persistAssistantMessageContentAsync(
  db: SqlDatabase,
  input: PersistAssistantContentInput
) {
  await updateAssistantMessageAsync(
    db,
    input.assistantMessageId,
    input.content,
    'stopped',
    input.updatedAt
  );
}

export async function persistAssistantMessageStatusAsync(
  db: SqlDatabase,
  input: PersistAssistantStatusInput
) {
  await updateAssistantMessageAsync(
    db,
    input.assistantMessageId,
    input.content,
    input.status,
    input.updatedAt
  );
}

export async function loadConversationTranscriptAsync(
  db: SqlDatabase,
  conversationId: string
): Promise<LoadedConversationTranscript> {
  const conversation = await getConversationAsync(db, conversationId);

  if (conversation == null) {
    throw new Error(`conversation not found: ${conversationId}`);
  }

  const messages = await listMessagesAsync(db, conversationId);

  return {
    conversation,
    messages: messages.map(toTranscriptMessage),
  };
}
