import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import {
  listConversationsAsync,
  listMessagesAsync,
  migrateDatabaseAsync,
} from '@/data';
import type { SqlDatabase, SqlRunResult } from '@/data';
import {
  loadConversationTranscriptAsync,
  persistAssistantMessageContentAsync,
  persistAssistantMessageStatusAsync,
  persistAssistantTurnStartAsync,
} from '@/state/chat-persistence';
import type { ChatTranscriptMessage } from '@/state/chat';

interface NodeStatement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  all(...params: unknown[]): Record<string, unknown>[];
  get(...params: unknown[]): Record<string, unknown> | undefined;
}

interface NodeDatabaseSync {
  exec(source: string): void;
  prepare(source: string): NodeStatement;
  close(): void;
}

const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (location: string) => NodeDatabaseSync;
};

class NodeSqlDatabase implements SqlDatabase {
  private readonly db = new DatabaseSync(':memory:');

  async execAsync(source: string) {
    this.db.exec(source);
  }

  async runAsync(source: string, params: unknown[] = []): Promise<SqlRunResult> {
    const result = this.db.prepare(source).run(...params);

    return {
      changes: result.changes,
      lastInsertRowId: Number(result.lastInsertRowid),
    };
  }

  async getFirstAsync<T>(source: string, params: unknown[] = []) {
    return (this.db.prepare(source).get(...params) ?? null) as T | null;
  }

  async getAllAsync<T>(source: string, params: unknown[] = []) {
    return this.db.prepare(source).all(...params) as T[];
  }

  close() {
    this.db.close();
  }
}

async function setupDatabase() {
  const db = new NodeSqlDatabase();
  await migrateDatabaseAsync(db);
  return db;
}

function createUserMessage(content = 'Plan a mountain weekend with friends'): ChatTranscriptMessage {
  return {
    content,
    createdAt: 100,
    id: 'user-1',
    role: 'user',
    status: 'complete',
  };
}

function createAssistantMessage(): ChatTranscriptMessage {
  return {
    content: '',
    createdAt: 101,
    id: 'assistant-1',
    role: 'assistant',
    status: 'streaming',
  };
}

describe('chat persistence', () => {
  let db: NodeSqlDatabase;

  beforeEach(async () => {
    db = await setupDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('creates a conversation on the first message and persists assistant partials', async () => {
    const started = await persistAssistantTurnStartAsync(db, {
      assistantMessage: createAssistantMessage(),
      conversationId: null,
      model: 'gpt-5.6-luna',
      userMessage: createUserMessage(),
    });

    await persistAssistantMessageContentAsync(db, {
      assistantMessageId: 'assistant-1',
      content: 'Packing layers',
      updatedAt: 150,
    });
    await persistAssistantMessageStatusAsync(db, {
      assistantMessageId: 'assistant-1',
      content: 'Packing layers and trail snacks.',
      status: 'complete',
      updatedAt: 200,
    });

    const conversations = await listConversationsAsync(db);
    const messages = await listMessagesAsync(db, started.conversationId);
    const loaded = await loadConversationTranscriptAsync(db, started.conversationId);

    expect(conversations).toEqual([
      expect.objectContaining({
        id: started.conversationId,
        model: 'gpt-5.6-luna',
        title: 'Plan a mountain weekend with friends',
        updatedAt: 200,
      }),
    ]);
    expect(messages).toEqual([
      expect.objectContaining({
        content: 'Plan a mountain weekend with friends',
        id: 'user-1',
        status: 'complete',
      }),
      expect.objectContaining({
        content: 'Packing layers and trail snacks.',
        id: 'assistant-1',
        status: 'complete',
      }),
    ]);
    expect(loaded).toEqual({
      conversation: expect.objectContaining({
        id: started.conversationId,
        title: 'Plan a mountain weekend with friends',
      }),
      messages: [
        expect.objectContaining({ id: 'user-1', role: 'user' }),
        expect.objectContaining({ id: 'assistant-1', role: 'assistant' }),
      ],
    });
  });

  it('appends later turns to the existing conversation', async () => {
    const first = await persistAssistantTurnStartAsync(db, {
      assistantMessage: createAssistantMessage(),
      conversationId: null,
      model: 'gpt-5.6-sol',
      userMessage: createUserMessage('First saved prompt'),
    });

    await persistAssistantTurnStartAsync(db, {
      assistantMessage: {
        ...createAssistantMessage(),
        createdAt: 201,
        id: 'assistant-2',
      },
      conversationId: first.conversationId,
      model: 'gpt-5.6-sol',
      userMessage: {
        ...createUserMessage('Second saved prompt'),
        createdAt: 200,
        id: 'user-2',
      },
    });

    expect(await listConversationsAsync(db)).toHaveLength(1);
    expect((await listMessagesAsync(db, first.conversationId)).map((message) => message.id)).toEqual([
      'user-1',
      'assistant-1',
      'user-2',
      'assistant-2',
    ]);
  });
});
