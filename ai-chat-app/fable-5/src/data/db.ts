// minimal async query surface shared by expo-sqlite's SQLiteDatabase and the
// better-sqlite3 adapter used in tests; repos depend only on this
export type ChatDb = {
  runAsync(sql: string, ...params: unknown[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
};

export const SCHEMA_SQL = `
create table if not exists conversations (
  id text primary key,
  title text not null,
  model text not null default 'gpt-5.6-luna',
  created_at integer not null,
  updated_at integer not null
);

create table if not exists messages (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  status text not null default 'complete' check (status in ('complete', 'stopped', 'error')),
  created_at integer not null
);

create index if not exists idx_messages_conversation on messages(conversation_id, created_at);
`;
