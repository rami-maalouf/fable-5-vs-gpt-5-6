import type { SleepSession } from '../src/domain/models';
import {
  formatElapsedSleep,
  toggleSleepSession,
  type SleepToggleRepository,
} from '../src/components/dashboard/sleep-toggle';
import {
  SHORT_SLEEP_JOKES,
  formatShortSleepDuration,
  getShortSleepJoke,
} from '../src/copy/jokes';

function session(overrides: Partial<SleepSession> = {}): SleepSession {
  return {
    id: 'sleep-1',
    tag: 'Sleep',
    startTime: 1_000,
    endTime: null,
    startTimeZone: 'America/Edmonton',
    endTimeZone: null,
    createdAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
  };
}

function repository(active: SleepSession | null): SleepToggleRepository & {
  create: jest.Mock;
  end: jest.Mock;
} {
  return {
    create: jest.fn(async (input) => session({ startTime: input.startTime })),
    end: jest.fn(async (id, input) =>
      session({ ...active, endTime: input.endTime, endTimeZone: input.endTimeZone, id }),
    ),
    getActive: jest.fn(async () => active),
  };
}

describe('sleep toggle', () => {
  it('creates a single persisted session when idle', async () => {
    const repo = repository(null);
    const result = await toggleSleepSession(repo, {
      now: 50_000,
      timeZone: 'America/Edmonton',
    });

    expect(repo.create).toHaveBeenCalledWith({
      startTime: 50_000,
      startTimeZone: 'America/Edmonton',
      tag: 'Sleep',
    });
    expect(result).toMatchObject({ kind: 'started', session: { endTime: null } });
  });

  it('ends a valid session without a short-sleep joke', async () => {
    const repo = repository(session({ startTime: 10_000 }));
    const result = await toggleSleepSession(repo, {
      now: 310_000,
      timeZone: 'America/Vancouver',
    });

    expect(repo.end).toHaveBeenCalledWith('sleep-1', {
      endTime: 310_000,
      endTimeZone: 'America/Vancouver',
    });
    expect(result).toMatchObject({ isValid: true, joke: null, kind: 'ended' });
  });

  it('returns a deterministic joke for an invalid short session', async () => {
    const repo = repository(session({ startTime: 10_000 }));
    const result = await toggleSleepSession(repo, {
      now: 129_000,
      timeZone: 'America/Edmonton',
    });

    expect(result).toMatchObject({ isValid: false, kind: 'ended' });
    expect(result.kind === 'ended' ? result.joke : null).toBe(getShortSleepJoke(119, 'sleep-1'));
  });

  it('formats the live elapsed timer', () => {
    expect(formatElapsedSleep(0)).toBe('0:00');
    expect(formatElapsedSleep(65)).toBe('1:05');
    expect(formatElapsedSleep(3_661)).toBe('1:01:01');
  });
});

describe('short sleep copy', () => {
  it('contains seven messages and pluralizes the interpolated duration', () => {
    expect(SHORT_SLEEP_JOKES).toHaveLength(7);
    expect(formatShortSleepDuration(30)).toBe('30 seconds');
    expect(formatShortSleepDuration(60)).toBe('1 minute');
    expect(formatShortSleepDuration(120)).toBe('2 minutes');
    for (const joke of SHORT_SLEEP_JOKES) {
      expect(joke('2 minutes')).toContain('2 minutes');
    }
  });
});
