// app-side wiring: opens the real expo-sqlite database and kv-store.
// kept separate from db.ts so the repository stays testable in node.
import { openDatabaseSync } from 'expo-sqlite';
import Storage from 'expo-sqlite/kv-store';

import { migrate } from './db';
import { SessionRepo } from './session-repo';
import { SettingsStore } from './settings-store';
import { createDemoSleepSessions, isDemoMode } from '../demo/demo-mode';

const db = openDatabaseSync('twilight.db');
migrate(db);

const sessionRepo = new SessionRepo(db);
const settingsStore = new SettingsStore(Storage);

if (isDemoMode) {
  settingsStore.set('isOnboarded', true);
  settingsStore.set('themeMode', 'dark');
  settingsStore.set('windDownReminderEnabled', false);
  db.runSync("delete from sleep_sessions where id like 'demo-sleep-%'");
  for (const session of createDemoSleepSessions()) {
    db.runSync(
      `insert into sleep_sessions
        (id, tag, start_time, end_time, start_tz, end_tz, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        'Sleep Mode',
        session.startTime,
        session.endTime,
        session.timeZone,
        session.timeZone,
        session.endTime,
        session.endTime,
      ],
    );
  }
}

export { sessionRepo, settingsStore };
