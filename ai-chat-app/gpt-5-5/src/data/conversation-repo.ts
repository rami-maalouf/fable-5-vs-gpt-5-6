import type { ChatModel } from '@/domain';
import { assertChatModel } from '@/domain';

import { mapConversationRow } from './mappers';
import type { SqlDatabase } from './sql-database';
import type { Conversation, ConversationRow, CreateConversationInput } from './types';

function likePattern(query: string) {
  const escaped = query.trim().toLocaleLowerCase().replace(/[\\%_]/g, (value) => `\\${value}`);
  return `%${escaped}%`;
}

export async function createConversationAsync(
  db: SqlDatabase,
  input: CreateConversationInput
): Promise<Conversation> {
  assertChatModel(input.model);

  const updatedAt = input.updatedAt ?? input.createdAt;

  await db.runAsync(
    `INSERT INTO conversations (id, title, model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [input.id, input.title, input.model, input.createdAt, updatedAt]
  );

  return {
    id: input.id,
    title: input.title,
    model: input.model,
    createdAt: input.createdAt,
    updatedAt,
  };
}

export async function getConversationAsync(db: SqlDatabase, id: string) {
  const row = await db.getFirstAsync<ConversationRow>(
    `SELECT id, title, model, created_at, updated_at
     FROM conversations
     WHERE id = ?`,
    [id]
  );

  return row == null ? null : mapConversationRow(row);
}

export async function listConversationsAsync(db: SqlDatabase) {
  const rows = await db.getAllAsync<ConversationRow>(
    `SELECT id, title, model, created_at, updated_at
     FROM conversations
     ORDER BY updated_at DESC, created_at DESC`
  );

  return rows.map(mapConversationRow);
}

export async function searchConversationsAsync(db: SqlDatabase, query: string) {
  if (query.trim().length === 0) {
    return listConversationsAsync(db);
  }

  const pattern = likePattern(query);
  const rows = await db.getAllAsync<ConversationRow>(
    `SELECT DISTINCT c.id, c.title, c.model, c.created_at, c.updated_at
     FROM conversations c
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE lower(c.title) LIKE ? ESCAPE '\\'
        OR lower(m.content) LIKE ? ESCAPE '\\'
     ORDER BY c.updated_at DESC, c.created_at DESC`,
    [pattern, pattern]
  );

  return rows.map(mapConversationRow);
}

export async function renameConversationAsync(
  db: SqlDatabase,
  id: string,
  title: string,
  updatedAt: number
) {
  await db.runAsync(
    `UPDATE conversations
     SET title = ?, updated_at = ?
     WHERE id = ?`,
    [title, updatedAt, id]
  );
}

export async function updateConversationModelAsync(
  db: SqlDatabase,
  id: string,
  model: ChatModel,
  updatedAt: number
) {
  assertChatModel(model);

  await db.runAsync(
    `UPDATE conversations
     SET model = ?, updated_at = ?
     WHERE id = ?`,
    [model, updatedAt, id]
  );
}

export async function touchConversationAsync(db: SqlDatabase, id: string, updatedAt: number) {
  await db.runAsync(
    `UPDATE conversations
     SET updated_at = ?
     WHERE id = ?`,
    [updatedAt, id]
  );
}

export async function deleteConversationAsync(db: SqlDatabase, id: string) {
  await db.runAsync(`DELETE FROM conversations WHERE id = ?`, [id]);
}
