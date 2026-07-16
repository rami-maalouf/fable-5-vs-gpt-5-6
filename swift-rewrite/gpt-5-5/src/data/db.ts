import * as SQLite from 'expo-sqlite';

import type { SQLiteDatabaseLike } from './session-repo';

export const TWILIGHT_DATABASE_NAME = 'twilight.db';

export async function openTwilightDatabase(databaseName = TWILIGHT_DATABASE_NAME) {
  const db = await SQLite.openDatabaseAsync(databaseName);
  await migrateTwilightDb(db);
  return db;
}

export async function migrateTwilightDb(db: SQLiteDatabaseLike) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS sleep_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      tag TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      start_tz TEXT NOT NULL,
      end_tz TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS sleep_sessions_one_active
      ON sleep_sessions ((1))
      WHERE end_time IS NULL;

    CREATE INDEX IF NOT EXISTS sleep_sessions_end_time
      ON sleep_sessions (end_time);
  `);
}
