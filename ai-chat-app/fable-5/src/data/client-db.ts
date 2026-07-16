import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { SCHEMA_SQL, type ChatDb } from '@/data/db';

let dbPromise: Promise<SQLiteDatabase> | null = null;

// lazy singleton for the on-device database; the SQLiteDatabase instance
// satisfies the ChatDb interface the repos are written against
export function getDb(): Promise<ChatDb> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDatabaseAsync('nova.db');
      await db.execAsync('pragma journal_mode = WAL; pragma foreign_keys = ON;');
      await db.execAsync(SCHEMA_SQL);
      return db;
    })();
  }
  return dbPromise;
}
