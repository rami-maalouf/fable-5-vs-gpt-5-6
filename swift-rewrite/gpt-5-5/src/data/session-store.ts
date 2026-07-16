import { openTwilightDatabase } from './db';
import { SessionRepository } from './session-repo';

let repositoryPromise: Promise<SessionRepository> | null = null;

export function getSessionRepository() {
  repositoryPromise ??= openTwilightDatabase().then((db) => new SessionRepository(db));

  return repositoryPromise;
}
