// adapts node:sqlite (jest runtime) to the SqlDatabase interface the repo uses,
// so tests exercise the exact sql the app runs on expo-sqlite
import { DatabaseSync } from 'node:sqlite';

import type { SqlDatabase } from '@/data/db';

export function memoryDb(): SqlDatabase {
  const db = new DatabaseSync(':memory:');
  return {
    execSync: (sql: string) => {
      db.exec(sql);
    },
    runSync: (sql: string, params: (string | number | null)[]) => {
      db.prepare(sql).run(...params);
    },
    getAllSync: <T>(sql: string, params: (string | number | null)[]) =>
      db.prepare(sql).all(...params) as T[],
    getFirstSync: <T>(sql: string, params: (string | number | null)[]) =>
      (db.prepare(sql).get(...params) as T | undefined) ?? null,
  };
}
