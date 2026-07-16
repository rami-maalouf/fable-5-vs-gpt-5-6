import type {
  CreateSleepSessionInput,
  EndSleepSessionInput,
} from '@/data/session-repo';
import type { SleepSession } from '@/domain/models';
import { getSessionDurationSeconds, isValidSleepSession } from '@/domain/session-rules';
import { getShortSleepJoke } from '@/copy/jokes';

export interface SleepToggleRepository {
  create(input: CreateSleepSessionInput): Promise<SleepSession>;
  end(id: string, input: EndSleepSessionInput): Promise<SleepSession>;
  getActive(): Promise<SleepSession | null>;
}

export interface SleepToggleContext {
  now: number;
  timeZone: string;
}

export type SleepToggleResult =
  | { kind: 'started'; session: SleepSession }
  | { isValid: boolean; joke: string | null; kind: 'ended'; session: SleepSession };

export async function toggleSleepSession(
  repository: SleepToggleRepository,
  context: SleepToggleContext,
): Promise<SleepToggleResult> {
  const activeSession = await repository.getActive();
  if (!activeSession) {
    const session = await repository.create({
      startTime: context.now,
      startTimeZone: context.timeZone,
      tag: 'Sleep',
    });
    return { kind: 'started', session };
  }

  const session = await repository.end(activeSession.id, {
    endTime: context.now,
    endTimeZone: context.timeZone,
  });
  const isValid = isValidSleepSession(session);
  const duration = getSessionDurationSeconds(session) ?? 0;
  return {
    isValid,
    joke: isValid ? null : getShortSleepJoke(duration, session.id),
    kind: 'ended',
    session,
  };
}

export function formatElapsedSleep(durationSeconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours === 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
