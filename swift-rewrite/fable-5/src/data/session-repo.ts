// ports: Models/BlockedProfileSessions.swift (create/end/find/recentInactiveSessions)
// persistence swap: SwiftData -> expo-sqlite (spec decision)
import type { SleepSession } from '../domain/models';
import { MINIMUM_SESSION_SECONDS } from '../domain/session-rules';
import type { SqlDatabase } from './db';

interface SessionRow {
  id: string;
  tag: string;
  start_time: number;
  end_time: number | null;
  start_tz: string;
  end_tz: string | null;
  created_at: number;
  updated_at: number;
}

function toSession(row: SessionRow): SleepSession {
  return {
    id: row.id,
    tag: row.tag,
    startTime: row.start_time,
    endTime: row.end_time,
    startTimeZone: row.start_tz,
    endTimeZone: row.end_tz,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// local ids only; matches the shape of UUID().uuidString
function makeId(): string {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  const s = (n: number) => Array.from({ length: n }, hex).join('');
  return `${s(8)}-${s(4)}-4${s(3)}-${((Math.random() * 4) | 8).toString(16)}${s(3)}-${s(12)}`.toUpperCase();
}

export class SessionRepo {
  constructor(private readonly db: SqlDatabase) {}

  getActiveSession(): SleepSession | null {
    const row = this.db.getFirstSync<SessionRow>(
      'select * from sleep_sessions where end_time is null order by start_time desc limit 1',
      []
    );
    return row ? toSession(row) : null;
  }

  // exactly one active session may exist (spec invariant)
  startSession(tag: string, startTimeZone: string, nowMs = Date.now()): SleepSession {
    if (this.getActiveSession()) {
      throw new Error('an active session already exists');
    }
    const session: SleepSession = {
      id: makeId(),
      tag,
      startTime: nowMs,
      endTime: null,
      startTimeZone,
      endTimeZone: null,
      createdAt: nowMs,
      updatedAt: nowMs,
    };
    this.insert(session);
    return session;
  }

  endActiveSession(endTimeZone: string, nowMs = Date.now()): SleepSession | null {
    const active = this.getActiveSession();
    if (!active) return null;
    this.db.runSync(
      'update sleep_sessions set end_time = ?, end_tz = ?, updated_at = ? where id = ?',
      [nowMs, endTimeZone, nowMs, active.id]
    );
    return this.getSession(active.id);
  }

  createManualLog(input: {
    startTime: number;
    endTime: number;
    startTimeZone: string;
    endTimeZone: string;
    nowMs?: number;
  }): SleepSession {
    const now = input.nowMs ?? Date.now();
    const session: SleepSession = {
      id: makeId(),
      tag: 'Manual Log',
      startTime: input.startTime,
      endTime: input.endTime,
      startTimeZone: input.startTimeZone,
      endTimeZone: input.endTimeZone,
      createdAt: now,
      updatedAt: now,
    };
    this.insert(session);
    return session;
  }

  updateSession(
    id: string,
    input: {
      startTime: number;
      endTime: number;
      startTimeZone: string;
      endTimeZone: string;
      nowMs?: number;
    }
  ): void {
    const now = input.nowMs ?? Date.now();
    this.db.runSync(
      `update sleep_sessions
         set start_time = ?, end_time = ?, start_tz = ?, end_tz = ?, updated_at = ?
       where id = ?`,
      [input.startTime, input.endTime, input.startTimeZone, input.endTimeZone, now, id]
    );
  }

  deleteSession(id: string): void {
    this.db.runSync('delete from sleep_sessions where id = ?', [id]);
  }

  getSession(id: string): SleepSession | null {
    const row = this.db.getFirstSync<SessionRow>('select * from sleep_sessions where id = ?', [
      id,
    ]);
    return row ? toSession(row) : null;
  }

  // completed sessions of at least 5 minutes, newest wake first
  // (swift recentInactiveSessions filters isValidSession the same way)
  listValidSessions(): SleepSession[] {
    const rows = this.db.getAllSync<SessionRow>(
      `select * from sleep_sessions
        where end_time is not null and (end_time - start_time) >= ?
        order by end_time desc`,
      [MINIMUM_SESSION_SECONDS * 1000]
    );
    return rows.map(toSession);
  }

  private insert(s: SleepSession): void {
    this.db.runSync(
      `insert into sleep_sessions
         (id, tag, start_time, end_time, start_tz, end_tz, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.tag, s.startTime, s.endTime, s.startTimeZone, s.endTimeZone, s.createdAt, s.updatedAt]
    );
  }
}
