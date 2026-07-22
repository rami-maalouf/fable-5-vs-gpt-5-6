import { openTwilightDatabase } from './db';
import { SessionRepository } from './session-repo';
import { createDemoSleepSessions, isDemoMode } from '@/demo/demo-mode';

let repositoryPromise: Promise<SessionRepository> | null = null;

export function getSessionRepository() {
  repositoryPromise ??= openTwilightDatabase().then(async (db) => {
    const repository = new SessionRepository(db);
    if (isDemoMode) {
      await db.runAsync("DELETE FROM sleep_sessions WHERE id LIKE 'demo-sleep-%'");
      for (const session of createDemoSleepSessions()) {
        await repository.create(session);
      }
    }
    return repository;
  });

  return repositoryPromise;
}
