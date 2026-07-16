jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('expo-sqlite/kv-store', () => ({ __esModule: true, default: {} }));

import { SLEEP_SESSION_SCHEMA_SQL } from '../src/data/db';
import {
  ActiveSleepSessionError,
  SessionRepository,
  type SessionDatabase,
  type SessionDatabaseValue,
} from '../src/data/session-repo';
import {
  DEFAULT_SLEEP_SETTINGS,
  createSettingsStore,
  type KeyValueStorage,
} from '../src/data/settings-store';

interface StoredRow {
  id: string;
  tag: string;
  start_time: number;
  end_time: number | null;
  start_tz: string;
  end_tz: string | null;
  created_at: number;
  updated_at: number;
}

class MemorySessionDatabase implements SessionDatabase {
  private readonly rows = new Map<string, StoredRow>();

  async runAsync(query: string, parameters: SessionDatabaseValue[] = []) {
    if (query.includes('INSERT INTO sleep_sessions')) {
      const [id, tag, startTime, endTime, startTimeZone, endTimeZone, createdAt, updatedAt] =
        parameters;
      this.rows.set(String(id), {
        id: String(id),
        tag: String(tag),
        start_time: Number(startTime),
        end_time: endTime === null ? null : Number(endTime),
        start_tz: String(startTimeZone),
        end_tz: endTimeZone === null ? null : String(endTimeZone),
        created_at: Number(createdAt),
        updated_at: Number(updatedAt),
      });
      return { changes: 1 };
    }

    if (query.includes('SET end_time = ?')) {
      const [endTime, endTimeZone, updatedAt, id] = parameters;
      const row = this.rows.get(String(id));
      if (row) {
        row.end_time = Number(endTime);
        row.end_tz = String(endTimeZone);
        row.updated_at = Number(updatedAt);
      }
      return { changes: row ? 1 : 0 };
    }

    if (query.includes('UPDATE sleep_sessions')) {
      const [tag, startTime, endTime, startTimeZone, endTimeZone, updatedAt, id] = parameters;
      const row = this.rows.get(String(id));
      if (row) {
        row.tag = String(tag);
        row.start_time = Number(startTime);
        row.end_time = endTime === null ? null : Number(endTime);
        row.start_tz = String(startTimeZone);
        row.end_tz = endTimeZone === null ? null : String(endTimeZone);
        row.updated_at = Number(updatedAt);
      }
      return { changes: row ? 1 : 0 };
    }

    if (query.includes('DELETE FROM sleep_sessions')) {
      return { changes: this.rows.delete(String(parameters[0])) ? 1 : 0 };
    }

    throw new Error(`Unexpected query: ${query}`);
  }

  async getFirstAsync<T>(query: string, parameters: SessionDatabaseValue[] = []) {
    if (query.includes('WHERE id = ?')) {
      return (this.rows.get(String(parameters[0])) as T | undefined) ?? null;
    }
    if (query.includes('WHERE end_time IS NULL')) {
      const active = [...this.rows.values()]
        .filter((row) => row.end_time === null)
        .sort((left, right) => right.start_time - left.start_time)[0];
      return (active as T | undefined) ?? null;
    }
    throw new Error(`Unexpected query: ${query}`);
  }

  async getAllAsync<T>(query: string) {
    if (!query.includes('end_time - start_time >= ?')) {
      throw new Error(`Unexpected query: ${query}`);
    }
    return [...this.rows.values()]
      .filter((row) => row.end_time !== null && row.end_time - row.start_time >= 300_000)
      .sort((left, right) => (right.end_time ?? 0) - (left.end_time ?? 0)) as T[];
  }
}

class MemoryKeyValueStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  async removeItem(key: string) {
    this.values.delete(key);
  }
}

describe('database schema', () => {
  it('defines the complete session table and race-safe active-session index', () => {
    for (const column of [
      'id',
      'tag',
      'start_time',
      'end_time',
      'start_tz',
      'end_tz',
      'created_at',
      'updated_at',
    ]) {
      expect(SLEEP_SESSION_SCHEMA_SQL).toContain(column);
    }
    expect(SLEEP_SESSION_SCHEMA_SQL).toContain('UNIQUE INDEX');
    expect(SLEEP_SESSION_SCHEMA_SQL).toContain('WHERE end_time IS NULL');
  });
});

describe('session repository', () => {
  it('round-trips timezone fields and enforces one active session', async () => {
    const repository = new SessionRepository(new MemorySessionDatabase(), {
      createId: () => 'session-1',
      now: () => 1_000,
    });

    const created = await repository.create({
      startTime: 10_000,
      startTimeZone: 'America/Edmonton',
      tag: 'Sleep',
    });

    expect(created).toMatchObject({
      id: 'session-1',
      startTimeZone: 'America/Edmonton',
      endTime: null,
      endTimeZone: null,
    });
    await expect(
      repository.create({ startTime: 20_000, startTimeZone: 'Europe/London', tag: 'Sleep' }),
    ).rejects.toBeInstanceOf(ActiveSleepSessionError);

    const ended = await repository.end('session-1', {
      endTime: 310_000,
      endTimeZone: 'Europe/London',
    });
    expect(ended).toMatchObject({
      startTimeZone: 'America/Edmonton',
      endTimeZone: 'Europe/London',
    });
    expect(await repository.listValid()).toEqual([ended]);
    expect(await repository.getActive()).toBeNull();
  });

  it('filters sub-five-minute sessions and supports update and delete', async () => {
    let nextId = 0;
    let now = 2_000;
    const repository = new SessionRepository(new MemorySessionDatabase(), {
      createId: () => `session-${++nextId}`,
      now: () => ++now,
    });

    const short = await repository.create({
      startTime: 100_000,
      startTimeZone: 'America/Toronto',
      tag: 'Sleep',
    });
    await repository.end(short.id, {
      endTime: 399_999,
      endTimeZone: 'America/Toronto',
    });
    expect(await repository.listValid()).toEqual([]);

    const updated = await repository.update({
      ...short,
      endTime: 500_000,
      endTimeZone: 'America/Vancouver',
      tag: 'Manual Log',
    });
    expect(await repository.listValid()).toEqual([updated]);

    await repository.delete(short.id);
    expect(await repository.listValid()).toEqual([]);
  });
});

describe('settings store', () => {
  it('returns every spec default when storage is empty', async () => {
    const store = createSettingsStore(new MemoryKeyValueStorage());

    expect(await store.getAll()).toEqual(DEFAULT_SLEEP_SETTINGS);
    expect(DEFAULT_SLEEP_SETTINGS).toEqual({
      isOnboarded: false,
      optimalSleepMinutes: 22 * 60,
      optimalWakeMinutes: 7 * 60,
      windDownReminderEnabled: true,
      themeMode: 'dark',
      themePalette: 'twilight',
      liveActivityEnabled: true,
      liveActivityId: null,
    });
  });

  it('persists typed values and falls back from corrupt data', async () => {
    const storage = new MemoryKeyValueStorage();
    const store = createSettingsStore(storage);

    await store.set('themeMode', 'light');
    await store.set('optimalWakeMinutes', 8 * 60 + 15);
    expect(await createSettingsStore(storage).getAll()).toMatchObject({
      themeMode: 'light',
      optimalWakeMinutes: 8 * 60 + 15,
    });

    storage.values.set('theme_mode', JSON.stringify('neon'));
    expect(await store.get('themeMode')).toBe('dark');
  });
});
