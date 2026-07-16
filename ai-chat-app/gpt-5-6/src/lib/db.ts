import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { ChatModel } from '@/lib/chat-stream';
import { toLikePattern } from '@/lib/db-values';

export const DATABASE_NAME = 'nova.db';
export const DATABASE_VERSION = 1;

export type ConversationRecord = {
  id: string;
  title: string;
  model: ChatModel;
  createdAt: number;
  updatedAt: number;
};

export type MessageRecord = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

type ConversationRow = {
  id: string;
  title: string;
  model: ChatModel;
  created_at: number;
  updated_at: number;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
};

const CONVERSATION_COLUMNS = 'id, title, model, created_at, updated_at';
const MESSAGE_COLUMNS = 'id, conversation_id, role, content, created_at';

let defaultDatabasePromise: Promise<SQLiteDatabase> | null = null;

function mapConversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    title: row.title,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

function requireText(value: string, fieldName: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
  return normalized;
}

function requireContent(value: string) {
  if (!value.trim()) {
    throw new Error('Message content cannot be empty.');
  }
  return value;
}

async function migrateDatabase(database: SQLiteDatabase) {
  const versionRow = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error(`Database version ${currentVersion} is newer than supported version ${DATABASE_VERSION}.`);
  }

  if (currentVersion < 1) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        CREATE TABLE conversations (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          model TEXT NOT NULL DEFAULT 'gpt-5.6-luna',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE messages (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );

        CREATE INDEX conversations_updated_at_idx
          ON conversations(updated_at DESC, created_at DESC);
        CREATE INDEX messages_conversation_created_at_idx
          ON messages(conversation_id, created_at ASC);

        PRAGMA user_version = 1;
      `);
    });
  }
}

export async function openNovaDatabase(databaseName = DATABASE_NAME) {
  const database = await openDatabaseAsync(databaseName);
  try {
    await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await migrateDatabase(database);
    return database;
  } catch (error) {
    await database.closeAsync();
    throw error;
  }
}

export function getDatabase() {
  if (!defaultDatabasePromise) {
    defaultDatabasePromise = openNovaDatabase().catch((error) => {
      defaultDatabasePromise = null;
      throw error;
    });
  }

  return defaultDatabasePromise;
}

export async function createConversation(
  database: SQLiteDatabase,
  input: {
    id: string;
    title: string;
    model?: ChatModel;
    timestamp?: number;
  },
) {
  const timestamp = input.timestamp ?? Date.now();
  const conversation: ConversationRecord = {
    id: requireText(input.id, 'Conversation id'),
    title: requireText(input.title, 'Conversation title'),
    model: input.model ?? 'gpt-5.6-luna',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await database.runAsync(
    `INSERT INTO conversations (id, title, model, created_at, updated_at)
     VALUES ($id, $title, $model, $createdAt, $updatedAt)`,
    {
      $id: conversation.id,
      $title: conversation.title,
      $model: conversation.model,
      $createdAt: conversation.createdAt,
      $updatedAt: conversation.updatedAt,
    },
  );

  return conversation;
}

export async function getConversation(database: SQLiteDatabase, id: string) {
  const row = await database.getFirstAsync<ConversationRow>(
    `SELECT ${CONVERSATION_COLUMNS} FROM conversations WHERE id = $id`,
    { $id: id },
  );
  return row ? mapConversation(row) : null;
}

export async function listConversations(database: SQLiteDatabase) {
  const rows = await database.getAllAsync<ConversationRow>(
    `SELECT ${CONVERSATION_COLUMNS}
     FROM conversations
     ORDER BY updated_at DESC, created_at DESC, id DESC`,
  );
  return rows.map(mapConversation);
}

export async function renameConversation(database: SQLiteDatabase, id: string, title: string) {
  await database.runAsync('UPDATE conversations SET title = $title WHERE id = $id', {
    $id: id,
    $title: requireText(title, 'Conversation title'),
  });
}

export async function deleteConversation(database: SQLiteDatabase, id: string) {
  await database.runAsync('DELETE FROM conversations WHERE id = $id', { $id: id });
}

export async function searchConversations(database: SQLiteDatabase, query: string) {
  if (!query.trim()) {
    return listConversations(database);
  }

  const rows = await database.getAllAsync<ConversationRow>(
    `SELECT ${CONVERSATION_COLUMNS}
     FROM conversations AS conversation
     WHERE conversation.title COLLATE NOCASE LIKE $pattern ESCAPE '\\'
        OR EXISTS (
          SELECT 1
          FROM messages AS message
          WHERE message.conversation_id = conversation.id
            AND message.content COLLATE NOCASE LIKE $pattern ESCAPE '\\'
        )
     ORDER BY conversation.updated_at DESC, conversation.created_at DESC, conversation.id DESC`,
    { $pattern: toLikePattern(query) },
  );
  return rows.map(mapConversation);
}

export async function updateConversationModel(
  database: SQLiteDatabase,
  id: string,
  model: ChatModel,
  timestamp = Date.now(),
) {
  await database.runAsync(
    'UPDATE conversations SET model = $model, updated_at = $updatedAt WHERE id = $id',
    { $id: id, $model: model, $updatedAt: timestamp },
  );
}

export async function insertMessage(
  database: SQLiteDatabase,
  input: {
    id: string;
    conversationId: string;
    role: MessageRecord['role'];
    content: string;
    createdAt?: number;
  },
) {
  const message: MessageRecord = {
    id: requireText(input.id, 'Message id'),
    conversationId: requireText(input.conversationId, 'Conversation id'),
    role: input.role,
    content: requireContent(input.content),
    createdAt: input.createdAt ?? Date.now(),
  };

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      `INSERT INTO messages (id, conversation_id, role, content, created_at)
       VALUES ($id, $conversationId, $role, $content, $createdAt)`,
      {
        $id: message.id,
        $conversationId: message.conversationId,
        $role: message.role,
        $content: message.content,
        $createdAt: message.createdAt,
      },
    );
    await transaction.runAsync(
      `UPDATE conversations
       SET updated_at = MAX(updated_at, $updatedAt)
       WHERE id = $conversationId`,
      { $conversationId: message.conversationId, $updatedAt: message.createdAt },
    );
  });

  return message;
}

export async function listMessages(database: SQLiteDatabase, conversationId: string) {
  const rows = await database.getAllAsync<MessageRow>(
    `SELECT ${MESSAGE_COLUMNS}
     FROM messages
     WHERE conversation_id = $conversationId
     ORDER BY created_at ASC, id ASC`,
    { $conversationId: conversationId },
  );
  return rows.map(mapMessage);
}
