import { memoryDb } from '../../../tests/helpers/memory-db';
import { migrate } from '../db';
import { SessionRepo } from '../session-repo';

const T0 = Date.UTC(2025, 0, 15, 5, 0, 0);
const HOURS = 3600_000;

function makeRepo() {
  const db = memoryDb();
  migrate(db);
  return new SessionRepo(db);
}

describe('SessionRepo', () => {
  test('start -> end round-trips a session with tz fields intact', () => {
    const repo = makeRepo();
    const started = repo.startSession('Sleep Mode', 'America/Denver', T0);
    expect(started.endTime).toBeNull();
    expect(started.startTimeZone).toBe('America/Denver');

    const ended = repo.endActiveSession('America/Los_Angeles', T0 + 8 * HOURS);
    expect(ended).not.toBeNull();

    const fetched = repo.getSession(started.id);
    expect(fetched).toEqual({
      ...started,
      endTime: T0 + 8 * HOURS,
      endTimeZone: 'America/Los_Angeles',
      updatedAt: T0 + 8 * HOURS,
    });
  });

  test('exactly one active session is enforced', () => {
    const repo = makeRepo();
    repo.startSession('Sleep Mode', 'America/Denver', T0);
    expect(() => repo.startSession('Sleep Mode', 'America/Denver', T0 + 1000)).toThrow(
      /active session/i
    );
  });

  test('getActiveSession returns null when none is active', () => {
    const repo = makeRepo();
    expect(repo.getActiveSession()).toBeNull();
    repo.startSession('Sleep Mode', 'America/Denver', T0);
    expect(repo.getActiveSession()?.tag).toBe('Sleep Mode');
    repo.endActiveSession('America/Denver', T0 + 8 * HOURS);
    expect(repo.getActiveSession()).toBeNull();
  });

  test('ending with no active session returns null', () => {
    const repo = makeRepo();
    expect(repo.endActiveSession('America/Denver', T0)).toBeNull();
  });

  test('listValidSessions hides sub-5-minute sessions but keeps them stored', () => {
    const repo = makeRepo();
    repo.createManualLog({
      startTime: T0,
      endTime: T0 + 8 * HOURS,
      startTimeZone: 'America/Denver',
      endTimeZone: 'America/Denver',
      nowMs: T0 + 8 * HOURS,
    });
    const short = repo.createManualLog({
      startTime: T0 + 20 * HOURS,
      endTime: T0 + 20 * HOURS + 299_000,
      startTimeZone: 'America/Denver',
      endTimeZone: 'America/Denver',
      nowMs: T0 + 21 * HOURS,
    });

    const valid = repo.listValidSessions();
    expect(valid).toHaveLength(1);
    expect(valid[0].endTime).toBe(T0 + 8 * HOURS);
    // the short one still exists in storage (swift keeps it, lists filter it)
    expect(repo.getSession(short.id)).not.toBeNull();
  });

  test('a session of exactly 5 minutes is listed (>= boundary)', () => {
    const repo = makeRepo();
    repo.createManualLog({
      startTime: T0,
      endTime: T0 + 300_000,
      startTimeZone: 'America/Denver',
      endTimeZone: 'America/Denver',
      nowMs: T0 + HOURS,
    });
    expect(repo.listValidSessions()).toHaveLength(1);
  });

  test('listValidSessions orders by end time, newest first', () => {
    const repo = makeRepo();
    const mk = (offsetH: number) =>
      repo.createManualLog({
        startTime: T0 + offsetH * HOURS,
        endTime: T0 + (offsetH + 8) * HOURS,
        startTimeZone: 'America/Denver',
        endTimeZone: 'America/Denver',
        nowMs: T0 + (offsetH + 8) * HOURS,
      });
    const a = mk(0);
    const c = mk(48);
    const b = mk(24);
    expect(repo.listValidSessions().map((s) => s.id)).toEqual([c.id, b.id, a.id]);
  });

  test('manual logs carry the "Manual Log" tag', () => {
    const repo = makeRepo();
    const log = repo.createManualLog({
      startTime: T0,
      endTime: T0 + 8 * HOURS,
      startTimeZone: 'America/Denver',
      endTimeZone: 'America/Denver',
      nowMs: T0 + 8 * HOURS,
    });
    expect(log.tag).toBe('Manual Log');
  });

  test('updateSession edits times and timezones', () => {
    const repo = makeRepo();
    const log = repo.createManualLog({
      startTime: T0,
      endTime: T0 + 8 * HOURS,
      startTimeZone: 'America/Denver',
      endTimeZone: 'America/Denver',
      nowMs: T0 + 8 * HOURS,
    });
    repo.updateSession(log.id, {
      startTime: T0 + HOURS,
      endTime: T0 + 9 * HOURS,
      startTimeZone: 'Asia/Tokyo',
      endTimeZone: 'Asia/Tokyo',
      nowMs: T0 + 10 * HOURS,
    });
    const updated = repo.getSession(log.id);
    expect(updated?.startTime).toBe(T0 + HOURS);
    expect(updated?.endTime).toBe(T0 + 9 * HOURS);
    expect(updated?.startTimeZone).toBe('Asia/Tokyo');
    expect(updated?.updatedAt).toBe(T0 + 10 * HOURS);
  });

  test('deleteSession removes the row', () => {
    const repo = makeRepo();
    const log = repo.createManualLog({
      startTime: T0,
      endTime: T0 + 8 * HOURS,
      startTimeZone: 'America/Denver',
      endTimeZone: 'America/Denver',
      nowMs: T0 + 8 * HOURS,
    });
    repo.deleteSession(log.id);
    expect(repo.getSession(log.id)).toBeNull();
    expect(repo.listValidSessions()).toHaveLength(0);
  });

  test('migrate is idempotent', () => {
    const db = memoryDb();
    migrate(db);
    migrate(db);
    const repo = new SessionRepo(db);
    expect(repo.listValidSessions()).toHaveLength(0);
  });
});
