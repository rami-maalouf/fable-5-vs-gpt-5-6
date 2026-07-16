// app-side wiring: opens the real expo-sqlite database and kv-store.
// kept separate from db.ts so the repository stays testable in node.
import { openDatabaseSync } from 'expo-sqlite';
import Storage from 'expo-sqlite/kv-store';

import { migrate } from './db';
import { SessionRepo } from './session-repo';
import { SettingsStore } from './settings-store';

const db = openDatabaseSync('twilight.db');
migrate(db);

export const sessionRepo = new SessionRepo(db);
export const settingsStore = new SettingsStore(Storage);
