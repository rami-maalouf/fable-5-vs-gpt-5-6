import type { SleepSession } from './models';
import { endActiveSleepSession, startSleepSession, type SleepSessionToggleRepository } from './sleep-toggle';

class FakeToggleRepository implements SleepSessionToggleRepository {
  sessions = new Map<string, SleepSession>();

  async create(session: SleepSession) {
    if (await this.getActiveSession()) {
      throw new Error('active sleep session already exists');
    }

    this.sessions.set(session.id, session);
    return session;
  }

  async getActiveSession() {
    return Array.from(this.sessions.values()).find((session) => session.endTime == null) ?? null;
  }

  async update(session: SleepSession) {
    this.sessions.set(session.id, session);
    return session;
  }
}

describe('sleep toggle', () => {
  it('starts an active session with the current timezone', async () => {
    const repo = new FakeToggleRepository();
    const session = await startSleepSession(repo, {
      id: () => 'sleep-1',
      now: () => new Date('2026-02-01T06:00:00.000Z'),
      timeZone: () => 'America/Edmonton',
    });

    expect(session).toMatchObject({
      id: 'sleep-1',
      tag: 'Sleep Mode',
      startTimeZone: 'America/Edmonton',
      endTime: null,
      endTimeZone: null,
    });
    expect((await repo.getActiveSession())?.id).toBe('sleep-1');
  });

  it('ends a valid active session', async () => {
    const repo = new FakeToggleRepository();
    await startSleepSession(repo, {
      id: () => 'sleep-1',
      now: () => new Date('2026-02-01T06:00:00.000Z'),
      timeZone: () => 'America/Edmonton',
    });

    const result = await endActiveSleepSession(repo, {
      id: () => 'unused',
      now: () => new Date('2026-02-01T14:00:00.000Z'),
      timeZone: () => 'America/Edmonton',
    });

    expect(result).toMatchObject({
      status: 'ended',
      valid: true,
      joke: null,
      durationSeconds: 8 * 3600,
    });
    expect(await repo.getActiveSession()).toBeNull();
  });

  it('stores invalid sub-five-minute sessions and returns the jokey feedback', async () => {
    const repo = new FakeToggleRepository();
    await startSleepSession(repo, {
      id: () => 'sleep-1',
      now: () => new Date('2026-02-01T06:00:00.000Z'),
      timeZone: () => 'America/Edmonton',
    });

    const result = await endActiveSleepSession(repo, {
      id: () => 'unused',
      now: () => new Date('2026-02-01T06:04:00.000Z'),
      random: () => 0,
      timeZone: () => 'America/Edmonton',
    });

    expect(result).toMatchObject({
      status: 'ended',
      valid: false,
      joke: 'Did you really have a 4 minutes sleep?',
      durationSeconds: 240,
    });
    expect(repo.sessions.get('sleep-1')?.endTime).toEqual(new Date('2026-02-01T06:04:00.000Z'));
  });

  it('returns a no-active-session result when wake is pressed without an active session', async () => {
    const result = await endActiveSleepSession(new FakeToggleRepository(), {
      id: () => 'unused',
      now: () => new Date('2026-02-01T06:04:00.000Z'),
      timeZone: () => 'America/Edmonton',
    });

    expect(result).toEqual({ status: 'no-active-session' });
  });
});
