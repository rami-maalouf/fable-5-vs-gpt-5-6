import { deleteDatabaseAsync, openDatabaseAsync } from 'expo-sqlite';

import { createExpoSqlDatabaseAdapter } from './expo-sqlite-adapter';
import { migrateDatabaseAsync } from './schema';

export const NOVA_DATABASE_NAME = 'nova.db';

export async function openNovaDatabaseAsync(databaseName = NOVA_DATABASE_NAME) {
  const db = await openDatabaseAsync(databaseName);
  await migrateDatabaseAsync(createExpoSqlDatabaseAdapter(db));
  return db;
}

export async function deleteNovaDatabaseAsync(databaseName = NOVA_DATABASE_NAME) {
  await deleteDatabaseAsync(databaseName);
}
