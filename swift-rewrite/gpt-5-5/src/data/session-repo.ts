import type { SleepSession } from '@/domain/models';
import { isValidSleepSession } from '@/domain/session-rules';

export type SQLiteRunResultLike = {
  changes: number;
  lastInsertRowId: number;
};

export type SQLiteDatabaseLike = {
  execAsync(sql: string): Promise<unknown>;
  runAsync(sql: string, ...params: unknown[]): Promise<SQLiteRunResultLike>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
};

export type SleepSessionRow = {
  id: string;
  tag: string | null;
  start_time: number;
  end_time: number | null;
  start_tz: string;
  end_tz: string | null;
  created_at: number;
  updated_at: number;
};

function dateToMs(date: Date) {
  return date.getTime();
}

function rowToSession(row: SleepSessionRow): SleepSession {
  return {
    id: row.id,
    tag: row.tag,
    startTime: new Date(row.start_time),
    endTime: row.end_time == null ? null : new Date(row.end_time),
    startTimeZone: row.start_tz,
    endTimeZone: row.end_tz,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function sessionParams(session: SleepSession) {
  return [
    session.id,
    session.tag ?? null,
    dateToMs(session.startTime),
    session.endTime == null ? null : dateToMs(session.endTime),
    session.startTimeZone,
    session.endTimeZone,
    dateToMs(session.createdAt),
    dateToMs(session.updatedAt),
  ];
}

export class SessionRepository {
  constructor(private readonly db: SQLiteDatabaseLike) {}

  async create(session: SleepSession) {
    await this.assertSingleActiveSession(session);
    await this.db.runAsync(
      `INSERT INTO sleep_sessions
        (id, tag, start_time, end_time, start_tz, end_tz, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ...sessionParams(session),
    );

    return session;
  }

  async update(session: SleepSession) {
    const current = await this.getById(session.id);
    if (!current) {
      throw new Error(`sleep session not found: ${session.id}`);
    }

    await this.assertSingleActiveSession(session);
    await this.db.runAsync(
      `UPDATE sleep_sessions
        SET tag = ?, start_time = ?, end_time = ?, start_tz = ?, end_tz = ?, updated_at = ?
        WHERE id = ?`,
      session.tag ?? null,
      dateToMs(session.startTime),
      session.endTime == null ? null : dateToMs(session.endTime),
      session.startTimeZone,
      session.endTimeZone,
      dateToMs(session.updatedAt),
      session.id,
    );

    return session;
  }

  async delete(id: string) {
    await this.db.runAsync('DELETE FROM sleep_sessions WHERE id = ?', id);
  }

  async getById(id: string) {
    const row = await this.db.getFirstAsync<SleepSessionRow>('SELECT * FROM sleep_sessions WHERE id = ?', id);
    return row ? rowToSession(row) : null;
  }

  async getActiveSession() {
    const row = await this.db.getFirstAsync<SleepSessionRow>('SELECT * FROM sleep_sessions WHERE end_time IS NULL LIMIT 1');
    return row ? rowToSession(row) : null;
  }

  async listValidSessions() {
    const rows = await this.db.getAllAsync<SleepSessionRow>(
      'SELECT * FROM sleep_sessions WHERE end_time IS NOT NULL ORDER BY end_time DESC',
    );
    return rows.map(rowToSession).filter(isValidSleepSession);
  }

  async listCompletedSessions() {
    const rows = await this.db.getAllAsync<SleepSessionRow>(
      'SELECT * FROM sleep_sessions WHERE end_time IS NOT NULL ORDER BY end_time DESC',
    );
    return rows.map(rowToSession);
  }

  private async assertSingleActiveSession(session: SleepSession) {
    if (session.endTime != null) {
      return;
    }

    const existing = await this.getActiveSession();
    if (existing && existing.id !== session.id) {
      throw new Error('active sleep session already exists');
    }
  }
}
