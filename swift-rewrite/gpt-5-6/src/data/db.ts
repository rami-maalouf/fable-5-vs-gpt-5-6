// ports: twilight/models/blockedprofilesessions.swift

import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'twilight.db';
export const DATABASE_VERSION = 1;

export const SLEEP_SESSION_SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sleep_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  tag TEXT NOT NULL,
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
ON sleep_sessions (end_time DESC);
`;

let databasePromise: Promise<SQLiteDatabase> | null = null;

export async function migrateDatabase(database: SQLiteDatabase): Promise<void> {
  const versionRow = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await database.execAsync(SLEEP_SESSION_SCHEMA_SQL);
  }

  await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await migrateDatabase(database);
      return database;
    });
  }
  return databasePromise;
}
