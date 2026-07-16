import type { SleepSession } from '@/domain/models';

import { migrateTwilightDb } from './db';
import { SessionRepository, type SQLiteDatabaseLike } from './session-repo';

class InMemoryDatabase implements SQLiteDatabaseLike {
  rows = new Map<string, Record<string, unknown>>();

  async execAsync() {}

  async runAsync(sql: string, ...params: unknown[]) {
    const normalized = sql.trim().toLowerCase();

    if (normalized.startsWith('insert into sleep_sessions')) {
      const [id, tag, startTime, endTime, startTimeZone, endTimeZone, createdAt, updatedAt] = params;
      this.rows.set(String(id), {
        id,
        tag,
        start_time: startTime,
        end_time: endTime,
        start_tz: startTimeZone,
        end_tz: endTimeZone,
        created_at: createdAt,
        updated_at: updatedAt,
      });
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('update sleep_sessions')) {
      const [tag, startTime, endTime, startTimeZone, endTimeZone, updatedAt, id] = params;
      const row = this.rows.get(String(id));
      if (!row) {
        return { changes: 0, lastInsertRowId: 0 };
      }
      this.rows.set(String(id), {
        ...row,
        tag,
        start_time: startTime,
        end_time: endTime,
        start_tz: startTimeZone,
        end_tz: endTimeZone,
        updated_at: updatedAt,
      });
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (normalized.startsWith('delete from sleep_sessions')) {
      return { changes: this.rows.delete(String(params[0])) ? 1 : 0, lastInsertRowId: 0 };
    }

    throw new Error(`unhandled sql: ${sql}`);
  }

  async getFirstAsync<T>(sql: string, ...params: unknown[]) {
    const normalized = sql.trim().toLowerCase();

    if (normalized.includes('where id = ?')) {
      return (this.rows.get(String(params[0])) ?? null) as T | null;
    }

    if (normalized.includes('where end_time is null')) {
      return (Array.from(this.rows.values()).find((row) => row.end_time == null) ?? null) as T | null;
    }

    return null;
  }

  async getAllAsync<T>(sql: string) {
    const normalized = sql.trim().toLowerCase();
    const rows = Array.from(this.rows.values());

    if (normalized.includes('where end_time is not null')) {
      return rows.filter((row) => row.end_time != null).sort((left, right) => Number(right.end_time) - Number(left.end_time)) as T[];
    }

    return rows as T[];
  }
}

function completeSession(overrides: Partial<SleepSession> = {}): SleepSession {
  return {
    id: 'session-1',
    tag: 'Manual Log',
    startTime: new Date('2026-01-02T06:00:00.000Z'),
    endTime: new Date('2026-01-02T14:00:00.000Z'),
    startTimeZone: 'America/Edmonton',
    endTimeZone: 'America/Edmonton',
    createdAt: new Date('2026-01-02T15:00:00.000Z'),
    updatedAt: new Date('2026-01-02T15:00:00.000Z'),
    ...overrides,
  };
}

describe('SessionRepository', () => {
  it('migrates the expected sleep_sessions schema', async () => {
    const statements: string[] = [];
    const db: SQLiteDatabaseLike = {
      execAsync: async (sql) => {
        statements.push(sql);
      },
      getAllAsync: async () => [],
      getFirstAsync: async () => null,
      runAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
    };

    await migrateTwilightDb(db);

    expect(statements.join('\n')).toContain('CREATE TABLE IF NOT EXISTS sleep_sessions');
    expect(statements.join('\n')).toContain('start_tz TEXT NOT NULL');
    expect(statements.join('\n')).toContain('end_tz TEXT');
    expect(statements.join('\n')).toContain('CREATE UNIQUE INDEX IF NOT EXISTS sleep_sessions_one_active');
  });

  it('round-trips sessions with timezone fields intact', async () => {
    const repo = new SessionRepository(new InMemoryDatabase());
    const saved = await repo.create(completeSession({ startTimeZone: 'Asia/Tokyo', endTimeZone: 'America/Vancouver' }));

    expect(await repo.getById(saved.id)).toMatchObject({
      id: 'session-1',
      tag: 'Manual Log',
      startTimeZone: 'Asia/Tokyo',
      endTimeZone: 'America/Vancouver',
    });
  });

  it('enforces exactly one active session', async () => {
    const repo = new SessionRepository(new InMemoryDatabase());

    await repo.create(
      completeSession({
        id: 'active-1',
        endTime: null,
        endTimeZone: null,
      }),
    );

    await expect(
      repo.create(
        completeSession({
          id: 'active-2',
          endTime: null,
          endTimeZone: null,
        }),
      ),
    ).rejects.toThrow('active sleep session already exists');
    expect((await repo.getActiveSession())?.id).toBe('active-1');
  });

  it('updates, deletes, and lists only valid completed sessions', async () => {
    const repo = new SessionRepository(new InMemoryDatabase());
    await repo.create(completeSession({ id: 'valid' }));
    await repo.create(
      completeSession({
        id: 'invalid',
        startTime: new Date('2026-01-02T06:00:00.000Z'),
        endTime: new Date('2026-01-02T06:04:00.000Z'),
      }),
    );

    await repo.update(completeSession({ id: 'valid', tag: 'Edited Log' }));
    expect((await repo.listValidSessions()).map((session) => session.id)).toEqual(['valid']);
    expect((await repo.getById('valid'))?.tag).toBe('Edited Log');

    await repo.delete('valid');
    expect(await repo.getById('valid')).toBeNull();
  });
});
