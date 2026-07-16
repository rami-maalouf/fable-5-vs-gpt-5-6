// sqlite schema for the sleep_sessions table (spec data-model section).
// the interface is the structural subset of expo-sqlite's SQLiteDatabase the
// repository uses, so tests can drive the same sql through node:sqlite.

export interface SqlDatabase {
  execSync(sql: string): void;
  runSync(sql: string, params: (string | number | null)[]): void;
  getAllSync<T>(sql: string, params: (string | number | null)[]): T[];
  getFirstSync<T>(sql: string, params: (string | number | null)[]): T | null;
}

export function migrate(db: SqlDatabase): void {
  db.execSync(`
    create table if not exists sleep_sessions (
      id text primary key not null,
      tag text not null,
      start_time integer not null,
      end_time integer,
      start_tz text not null,
      end_tz text,
      created_at integer not null,
      updated_at integer not null
    );
    create index if not exists idx_sessions_end_time on sleep_sessions(end_time);
  `);
}
