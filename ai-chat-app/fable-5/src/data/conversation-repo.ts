import type { ChatDb } from '@/data/db';
import type { Conversation } from '@/domain/messages';
import type { SearchEntry } from '@/domain/search';

type ConversationRow = {
  id: string;
  title: string;
  model: string;
  created_at: number;
  updated_at: number;
};

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createConversation(db: ChatDb, c: Conversation): Promise<void> {
  await db.runAsync(
    'insert into conversations (id, title, model, created_at, updated_at) values (?, ?, ?, ?, ?)',
    c.id,
    c.title,
    c.model,
    c.createdAt,
    c.updatedAt,
  );
}

export async function getConversation(db: ChatDb, id: string): Promise<Conversation | null> {
  const row = await db.getFirstAsync<ConversationRow>(
    'select * from conversations where id = ?',
    id,
  );
  return row ? toConversation(row) : null;
}

export async function listConversations(db: ChatDb): Promise<Conversation[]> {
  const rows = await db.getAllAsync<ConversationRow>(
    'select * from conversations order by updated_at desc',
  );
  return rows.map(toConversation);
}

export async function renameConversation(db: ChatDb, id: string, title: string): Promise<void> {
  await db.runAsync('update conversations set title = ? where id = ?', title, id);
}

export async function deleteConversation(db: ChatDb, id: string): Promise<void> {
  await db.runAsync('delete from conversations where id = ?', id);
}

export async function touchConversation(db: ChatDb, id: string, now: number): Promise<void> {
  await db.runAsync('update conversations set updated_at = ? where id = ?', now, id);
}

export async function setConversationModel(db: ChatDb, id: string, model: string): Promise<void> {
  await db.runAsync('update conversations set model = ? where id = ?', model, id);
}

// title + concatenated message content per conversation, for the drawer's
// domain-level search filter
export async function getSearchIndex(db: ChatDb): Promise<SearchEntry[]> {
  return db.getAllAsync<SearchEntry>(
    `select c.id as id, c.title as title,
            coalesce(group_concat(m.content, ' '), '') as content
     from conversations c
     left join messages m on m.conversation_id = c.id
     group by c.id`,
  );
}
