import { mapMessageRow } from './mappers';
import type { SqlDatabase } from './sql-database';
import type { CreateMessageInput, MessageRow } from './types';

export async function createMessageAsync(db: SqlDatabase, input: CreateMessageInput) {
  const status = input.status ?? 'complete';

  await db.runAsync(
    `INSERT INTO messages (id, conversation_id, role, content, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.id, input.conversationId, input.role, input.content, status, input.createdAt]
  );

  await db.runAsync(
    `UPDATE conversations
     SET updated_at = ?
     WHERE id = ?`,
    [input.createdAt, input.conversationId]
  );

  return {
    id: input.id,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    status,
    createdAt: input.createdAt,
  };
}

export async function listMessagesAsync(db: SqlDatabase, conversationId: string) {
  const rows = await db.getAllAsync<MessageRow>(
    `SELECT id, conversation_id, role, content, status, created_at
     FROM messages
     WHERE conversation_id = ?
     ORDER BY created_at ASC`,
    [conversationId]
  );

  return rows.map(mapMessageRow);
}

export async function updateAssistantMessageAsync(
  db: SqlDatabase,
  id: string,
  content: string,
  status: 'complete' | 'stopped' | 'error',
  updatedAt?: number
) {
  await db.runAsync(
    `UPDATE messages
     SET content = ?, status = ?
     WHERE id = ? AND role = 'assistant'`,
    [content, status, id]
  );

  if (updatedAt == null) {
    return;
  }

  await db.runAsync(
    `UPDATE conversations
     SET updated_at = ?
     WHERE id = (
       SELECT conversation_id
       FROM messages
       WHERE id = ?
     )`,
    [updatedAt, id]
  );
}
