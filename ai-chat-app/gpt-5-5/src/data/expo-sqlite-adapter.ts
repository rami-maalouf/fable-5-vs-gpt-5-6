import type { SQLiteBindParams, SQLiteDatabase } from 'expo-sqlite';

import type { SqlDatabase } from './sql-database';

function bindParams(params: unknown[]) {
  return params as SQLiteBindParams;
}

export function createExpoSqlDatabaseAdapter(db: SQLiteDatabase): SqlDatabase {
  return {
    execAsync: (source) => db.execAsync(source),
    runAsync: async (source, params = []) => {
      const result = await db.runAsync(source, bindParams(params));

      return {
        changes: result.changes,
        lastInsertRowId: result.lastInsertRowId,
      };
    },
    getFirstAsync: (source, params = []) => db.getFirstAsync(source, bindParams(params)),
    getAllAsync: (source, params = []) => db.getAllAsync(source, bindParams(params)),
  };
}
