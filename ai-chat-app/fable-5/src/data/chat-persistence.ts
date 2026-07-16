import { createConversation, touchConversation } from '@/data/conversation-repo';
import type { ChatDb } from '@/data/db';
import { insertMessage } from '@/data/message-repo';
import type { Message } from '@/domain/messages';
import { deriveTitle } from '@/domain/title';

type UserTurn = {
  // true when this is the conversation's first message - the row is created
  // now, never on "new chat" (fresh-launch rule)
  isNewConversation: boolean;
  model: string;
  message: Message;
};

export async function persistUserTurn(db: ChatDb, turn: UserTurn): Promise<void> {
  const { message } = turn;
  if (turn.isNewConversation) {
    await createConversation(db, {
      id: message.conversationId,
      title: deriveTitle(message.content),
      model: turn.model,
      createdAt: message.createdAt,
      updatedAt: message.createdAt,
    });
  }
  await insertMessage(db, message);
  if (!turn.isNewConversation) {
    await touchConversation(db, message.conversationId, message.createdAt);
  }
}

export async function persistAssistantMessage(db: ChatDb, message: Message): Promise<void> {
  await insertMessage(db, message);
  await touchConversation(db, message.conversationId, message.createdAt);
}
