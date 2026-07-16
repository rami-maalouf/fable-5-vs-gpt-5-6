import type { ChatDb } from '@/data/db';
import type { Message, MessageStatus } from '@/domain/messages';

type MessageRow = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;
  created_at: number;
};

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function insertMessage(db: ChatDb, m: Message): Promise<void> {
  await db.runAsync(
    'insert into messages (id, conversation_id, role, content, status, created_at) values (?, ?, ?, ?, ?, ?)',
    m.id,
    m.conversationId,
    m.role,
    m.content,
    m.status,
    m.createdAt,
  );
}

export async function listMessages(db: ChatDb, conversationId: string): Promise<Message[]> {
  const rows = await db.getAllAsync<MessageRow>(
    'select * from messages where conversation_id = ? order by created_at asc, id asc',
    conversationId,
  );
  return rows.map(toMessage);
}

export async function updateMessage(
  db: ChatDb,
  id: string,
  content: string,
  status: MessageStatus,
): Promise<void> {
  await db.runAsync('update messages set content = ?, status = ? where id = ?', content, status, id);
}
