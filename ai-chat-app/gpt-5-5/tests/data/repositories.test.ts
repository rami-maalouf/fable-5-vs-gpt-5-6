import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import {
  createConversationAsync,
  createMessageAsync,
  deleteConversationAsync,
  listConversationsAsync,
  listMessagesAsync,
  migrateDatabaseAsync,
  searchConversationsAsync,
} from '@/data';
import type { SqlDatabase, SqlRunResult } from '@/data';

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

describe('sqlite repositories', () => {
  let db: NodeSqlDatabase;

  beforeEach(async () => {
    db = await setupDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('round-trips conversations and messages', async () => {
    await createConversationAsync(db, {
      id: 'conversation-1',
      title: 'First chat',
      model: 'gpt-5.6-luna',
      createdAt: 100,
    });

    await createMessageAsync(db, {
      id: 'message-1',
      conversationId: 'conversation-1',
      role: 'user',
      content: 'hello nova',
      createdAt: 110,
    });

    await createMessageAsync(db, {
      id: 'message-2',
      conversationId: 'conversation-1',
      role: 'assistant',
      content: 'hello back',
      status: 'complete',
      createdAt: 120,
    });

    const conversations = await listConversationsAsync(db);
    const messages = await listMessagesAsync(db, 'conversation-1');

    expect(conversations).toEqual([
      {
        id: 'conversation-1',
        title: 'First chat',
        model: 'gpt-5.6-luna',
        createdAt: 100,
        updatedAt: 120,
      },
    ]);
    expect(messages.map((message) => message.content)).toEqual(['hello nova', 'hello back']);
  });

  it('cascades messages when a conversation is deleted', async () => {
    await createConversationAsync(db, {
      id: 'conversation-1',
      title: 'Delete me',
      model: 'gpt-5.6-luna',
      createdAt: 100,
    });
    await createMessageAsync(db, {
      id: 'message-1',
      conversationId: 'conversation-1',
      role: 'user',
      content: 'remove this',
      createdAt: 110,
    });

    await deleteConversationAsync(db, 'conversation-1');

    expect(await listMessagesAsync(db, 'conversation-1')).toEqual([]);
  });

  it('orders conversations by newest activity first', async () => {
    await createConversationAsync(db, {
      id: 'older',
      title: 'Older',
      model: 'gpt-5.6-luna',
      createdAt: 100,
    });
    await createConversationAsync(db, {
      id: 'newer',
      title: 'Newer',
      model: 'gpt-5.6-sol',
      createdAt: 200,
    });
    await createMessageAsync(db, {
      id: 'message-1',
      conversationId: 'older',
      role: 'user',
      content: 'newest activity',
      createdAt: 300,
    });

    expect((await listConversationsAsync(db)).map((conversation) => conversation.id)).toEqual([
      'older',
      'newer',
    ]);
  });

  it('searches title and message content through the repository', async () => {
    await createConversationAsync(db, {
      id: 'c1',
      title: 'Travel ideas',
      model: 'gpt-5.6-luna',
      createdAt: 100,
    });
    await createConversationAsync(db, {
      id: 'c2',
      title: 'Error handling',
      model: 'gpt-5.6-sol',
      createdAt: 200,
    });
    await createMessageAsync(db, {
      id: 'm1',
      conversationId: 'c2',
      role: 'user',
      content: 'airplane mode retry flow',
      createdAt: 210,
    });

    expect((await searchConversationsAsync(db, 'travel')).map((item) => item.id)).toEqual(['c1']);
    expect((await searchConversationsAsync(db, 'retry')).map((item) => item.id)).toEqual(['c2']);
    expect(await searchConversationsAsync(db, 'missing')).toEqual([]);
  });
});
