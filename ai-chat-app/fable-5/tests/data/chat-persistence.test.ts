import Database from 'better-sqlite3';

import { persistAssistantMessage, persistUserTurn } from '@/data/chat-persistence';
import { getConversation, listConversations } from '@/data/conversation-repo';
import { SCHEMA_SQL, type ChatDb } from '@/data/db';
import { listMessages } from '@/data/message-repo';
import type { Message } from '@/domain/messages';

function openTestDb(): ChatDb {
  const raw = new Database(':memory:');
  raw.pragma('foreign_keys = ON');
  raw.exec(SCHEMA_SQL);
  return {
    runAsync: async (sql: string, ...params: unknown[]) => {
      raw.prepare(sql).run(...(params as never[]));
    },
    getAllAsync: async <T,>(sql: string, ...params: unknown[]) =>
      raw.prepare(sql).all(...(params as never[])) as T[],
    getFirstAsync: async <T,>(sql: string, ...params: unknown[]) =>
      (raw.prepare(sql).get(...(params as never[])) as T) ?? null,
  };
}

const userMsg = (id: string, conversationId: string, content: string, at: number): Message => ({
  id,
  conversationId,
  role: 'user',
  content,
  status: 'complete',
  createdAt: at,
});

const assistantMsg = (
  id: string,
  conversationId: string,
  content: string,
  status: Message['status'],
  at: number,
): Message => ({ id, conversationId, role: 'assistant', content, status, createdAt: at });

describe('persistUserTurn', () => {
  it('creates the conversation on the first message with a derived title', async () => {
    const db = openTestDb();
    await persistUserTurn(db, {
      isNewConversation: true,
      model: 'gpt-5.6-sol',
      message: userMsg('u1', 'c1', 'plan a weekend trip to kyoto with the family', 1000),
    });
    const conv = await getConversation(db, 'c1');
    expect(conv).not.toBeNull();
    expect(conv?.model).toBe('gpt-5.6-sol');
    expect(conv?.title).toBe('plan a weekend trip to kyoto with the…');
    expect(conv?.updatedAt).toBe(1000);
    expect(await listMessages(db, 'c1')).toHaveLength(1);
  });

  it('does not create a second conversation for later messages', async () => {
    const db = openTestDb();
    await persistUserTurn(db, {
      isNewConversation: true,
      model: 'gpt-5.6-luna',
      message: userMsg('u1', 'c1', 'first', 1000),
    });
    await persistUserTurn(db, {
      isNewConversation: false,
      model: 'gpt-5.6-luna',
      message: userMsg('u2', 'c1', 'second', 2000),
    });
    expect(await listConversations(db)).toHaveLength(1);
    expect(await listMessages(db, 'c1')).toHaveLength(2);
    // activity bumps updated_at
    expect((await getConversation(db, 'c1'))?.updatedAt).toBe(2000);
  });

  it('keeps the title from the first message only', async () => {
    const db = openTestDb();
    await persistUserTurn(db, {
      isNewConversation: true,
      model: 'gpt-5.6-luna',
      message: userMsg('u1', 'c1', 'original title', 1000),
    });
    await persistUserTurn(db, {
      isNewConversation: false,
      model: 'gpt-5.6-luna',
      message: userMsg('u2', 'c1', 'different text entirely', 2000),
    });
    expect((await getConversation(db, 'c1'))?.title).toBe('original title');
  });
});

describe('persistAssistantMessage', () => {
  it('saves the reply and bumps updated_at', async () => {
    const db = openTestDb();
    await persistUserTurn(db, {
      isNewConversation: true,
      model: 'gpt-5.6-luna',
      message: userMsg('u1', 'c1', 'hi', 1000),
    });
    await persistAssistantMessage(db, assistantMsg('a1', 'c1', 'hello there', 'complete', 2000));
    const all = await listMessages(db, 'c1');
    expect(all).toHaveLength(2);
    expect(all[1].content).toBe('hello there');
    expect((await getConversation(db, 'c1'))?.updatedAt).toBe(2000);
  });

  it('persists a stopped partial with its status', async () => {
    const db = openTestDb();
    await persistUserTurn(db, {
      isNewConversation: true,
      model: 'gpt-5.6-luna',
      message: userMsg('u1', 'c1', 'long story please', 1000),
    });
    await persistAssistantMessage(db, assistantMsg('a1', 'c1', 'once upon a', 'stopped', 2000));
    const all = await listMessages(db, 'c1');
    expect(all[1].status).toBe('stopped');
    expect(all[1].content).toBe('once upon a');
  });
});
