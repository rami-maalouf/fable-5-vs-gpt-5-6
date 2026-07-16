import type { SleepSession } from './models';
import { durationSeconds, isValidSleepSession } from './session-rules';
import { pickSubFiveMinuteSleepJoke } from '@/copy/jokes';

export type SleepSessionToggleRepository = {
  create(session: SleepSession): Promise<SleepSession>;
  getActiveSession(): Promise<SleepSession | null>;
  update(session: SleepSession): Promise<SleepSession>;
};

export type SleepToggleClock = {
  now: () => Date;
  timeZone: () => string;
  id: () => string;
  random?: () => number;
};

export type EndSleepSessionResult =
  | {
      status: 'no-active-session';
    }
  | {
      status: 'ended';
      session: SleepSession;
      valid: boolean;
      joke: string | null;
      durationSeconds: number;
    };

export async function startSleepSession(repository: SleepSessionToggleRepository, clock: SleepToggleClock) {
  const now = clock.now();
  const session: SleepSession = {
    id: clock.id(),
    startTime: now,
    endTime: null,
    startTimeZone: clock.timeZone(),
    endTimeZone: null,
    createdAt: now,
    updatedAt: now,
  };

  return repository.create(session);
}

export async function endActiveSleepSession(
  repository: SleepSessionToggleRepository,
  clock: SleepToggleClock,
): Promise<EndSleepSessionResult> {
  const activeSession = await repository.getActiveSession();

  if (!activeSession) {
    return { status: 'no-active-session' };
  }

  const now = clock.now();
  const endedSession: SleepSession = {
    ...activeSession,
    endTime: now,
    endTimeZone: clock.timeZone(),
    updatedAt: now,
  };
  const savedSession = await repository.update(endedSession);
  const seconds = durationSeconds(savedSession);
  const valid = isValidSleepSession(savedSession);

  return {
    status: 'ended',
    session: savedSession,
    valid,
    joke: valid ? null : pickSubFiveMinuteSleepJoke(seconds, clock.random),
    durationSeconds: seconds,
  };
}
