import Database from 'better-sqlite3';

import { SCHEMA_SQL, type ChatDb } from '@/data/db';
import {
  createConversation,
  deleteConversation,
  getConversation,
  getSearchIndex,
  listConversations,
  renameConversation,
  setConversationModel,
  touchConversation,
} from '@/data/conversation-repo';
import { insertMessage, listMessages, updateMessage } from '@/data/message-repo';

// adapter: better-sqlite3 (sync, node) exposed through the same async surface
// the repos use on expo-sqlite's SQLiteDatabase
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

const conv = (id: string, now: number, title = 'hello world') => ({
  id,
  title,
  model: 'gpt-5.6-luna',
  createdAt: now,
  updatedAt: now,
});

const msg = (id: string, conversationId: string, now: number, role: 'user' | 'assistant' = 'user') => ({
  id,
  conversationId,
  role,
  content: `content of ${id}`,
  status: 'complete' as const,
  createdAt: now,
});

describe('conversation repo', () => {
  it('round-trips a conversation', async () => {
    const db = openTestDb();
    await createConversation(db, conv('c1', 1000));
    const got = await getConversation(db, 'c1');
    expect(got).toEqual(conv('c1', 1000));
  });

  it('lists conversations newest-first by updated_at', async () => {
    const db = openTestDb();
    await createConversation(db, conv('old', 1000));
    await createConversation(db, conv('new', 2000));
    await createConversation(db, conv('mid', 1500));
    expect((await listConversations(db)).map((c) => c.id)).toEqual(['new', 'mid', 'old']);
  });

  it('touch bumps updated_at and reorders the list', async () => {
    const db = openTestDb();
    await createConversation(db, conv('a', 1000));
    await createConversation(db, conv('b', 2000));
    await touchConversation(db, 'a', 3000);
    expect((await listConversations(db)).map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('renames without changing updated_at ordering', async () => {
    const db = openTestDb();
    await createConversation(db, conv('a', 1000));
    await renameConversation(db, 'a', 'renamed');
    expect((await getConversation(db, 'a'))?.title).toBe('renamed');
    expect((await getConversation(db, 'a'))?.updatedAt).toBe(1000);
  });

  it('stores the model per conversation', async () => {
    const db = openTestDb();
    await createConversation(db, conv('a', 1000));
    await setConversationModel(db, 'a', 'gpt-5.6-terra');
    expect((await getConversation(db, 'a'))?.model).toBe('gpt-5.6-terra');
  });

  it('delete cascades to messages', async () => {
    const db = openTestDb();
    await createConversation(db, conv('a', 1000));
    await insertMessage(db, msg('m1', 'a', 1001));
    await insertMessage(db, msg('m2', 'a', 1002, 'assistant'));
    await deleteConversation(db, 'a');
    expect(await getConversation(db, 'a')).toBeNull();
    expect(await listMessages(db, 'a')).toHaveLength(0);
  });

  it('search index joins titles with all message content', async () => {
    const db = openTestDb();
    await createConversation(db, conv('a', 1000, 'Trip planning'));
    await insertMessage(db, { ...msg('m1', 'a', 1001), content: 'visit kyoto' });
    await insertMessage(db, { ...msg('m2', 'a', 1002), content: 'in spring' });
    await createConversation(db, conv('b', 2000, 'Empty one'));
    const index = await getSearchIndex(db);
    const a = index.find((e) => e.id === 'a');
    expect(a?.title).toBe('Trip planning');
    expect(a?.content).toContain('visit kyoto');
    expect(a?.content).toContain('in spring');
    expect(index.find((e) => e.id === 'b')?.content).toBe('');
  });
});

describe('message repo', () => {
  it('round-trips messages in created_at order', async () => {
    const db = openTestDb();
    await createConversation(db, conv('a', 1000));
    await insertMessage(db, msg('m2', 'a', 1002, 'assistant'));
    await insertMessage(db, msg('m1', 'a', 1001));
    const all = await listMessages(db, 'a');
    expect(all.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(all[0]).toEqual(msg('m1', 'a', 1001));
  });

  it('updates content and status (partial reply on stop)', async () => {
    const db = openTestDb();
    await createConversation(db, conv('a', 1000));
    await insertMessage(db, msg('m1', 'a', 1001, 'assistant'));
    await updateMessage(db, 'm1', 'partial text', 'stopped');
    const all = await listMessages(db, 'a');
    expect(all[0].content).toBe('partial text');
    expect(all[0].status).toBe('stopped');
  });
});
