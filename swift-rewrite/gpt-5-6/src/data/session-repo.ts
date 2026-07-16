// ports: twilight/models/blockedprofilesessions.swift

import type { SleepSession } from '@/domain/models';
import { MINIMUM_SESSION_DURATION_SECONDS } from '@/domain/session-rules';

import { getDatabase } from './db';

export type SessionDatabaseValue = string | number | null;

export interface SessionDatabase {
  runAsync(
    query: string,
    parameters?: SessionDatabaseValue[],
  ): Promise<{ changes: number }>;
  getFirstAsync<T>(
    query: string,
    parameters?: SessionDatabaseValue[],
  ): Promise<T | null>;
  getAllAsync<T>(query: string, parameters?: SessionDatabaseValue[]): Promise<T[]>;
}

interface SleepSessionRow {
  id: string;
  tag: string;
  start_time: number;
  end_time: number | null;
  start_tz: string;
  end_tz: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateSleepSessionInput {
  id?: string;
  tag: string;
  startTime: number;
  startTimeZone: string;
}

export interface EndSleepSessionInput {
  endTime: number;
  endTimeZone: string;
}

export interface CreateCompletedSleepSessionInput extends CreateSleepSessionInput {
  endTime: number;
  endTimeZone: string;
}

interface SessionRepositoryOptions {
  createId?: () => string;
  now?: () => number;
}

const insertSessionSql = `
  INSERT INTO sleep_sessions (
    id, tag, start_time, end_time, start_tz, end_tz, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

const updateEndedSessionSql = `
  UPDATE sleep_sessions
  SET end_time = ?, end_tz = ?, updated_at = ?
  WHERE id = ?
`;

const updateSessionSql = `
  UPDATE sleep_sessions
  SET tag = ?, start_time = ?, end_time = ?, start_tz = ?, end_tz = ?, updated_at = ?
  WHERE id = ?
`;

function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function fromRow(row: SleepSessionRow): SleepSession {
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

export class ActiveSleepSessionError extends Error {
  constructor() {
    super('A sleep session is already active');
    this.name = 'ActiveSleepSessionError';
  }
}

export class SessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Sleep session not found: ${id}`);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionRepository {
  private readonly createId: () => string;
  private readonly now: () => number;

  constructor(
    private readonly database: SessionDatabase,
    options: SessionRepositoryOptions = {},
  ) {
    this.createId = options.createId ?? createId;
    this.now = options.now ?? Date.now;
  }

  async create(input: CreateSleepSessionInput): Promise<SleepSession> {
    if (await this.getActive()) {
      throw new ActiveSleepSessionError();
    }

    const timestamp = this.now();
    const session: SleepSession = {
      id: input.id ?? this.createId(),
      tag: input.tag,
      startTime: input.startTime,
      endTime: null,
      startTimeZone: input.startTimeZone,
      endTimeZone: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.database.runAsync(insertSessionSql, [
      session.id,
      session.tag,
      session.startTime,
      session.endTime,
      session.startTimeZone,
      session.endTimeZone,
      session.createdAt,
      session.updatedAt,
    ]);
    return session;
  }

  async createCompleted(input: CreateCompletedSleepSessionInput): Promise<SleepSession> {
    if (input.endTime < input.startTime) {
      throw new Error('Sleep session end time cannot precede its start time');
    }
    const timestamp = this.now();
    const session: SleepSession = {
      id: input.id ?? this.createId(),
      tag: input.tag,
      startTime: input.startTime,
      endTime: input.endTime,
      startTimeZone: input.startTimeZone,
      endTimeZone: input.endTimeZone,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.database.runAsync(insertSessionSql, [
      session.id,
      session.tag,
      session.startTime,
      session.endTime,
      session.startTimeZone,
      session.endTimeZone,
      session.createdAt,
      session.updatedAt,
    ]);
    return session;
  }

  async end(id: string, input: EndSleepSessionInput): Promise<SleepSession> {
    const session = await this.getById(id);
    if (!session) {
      throw new SessionNotFoundError(id);
    }
    if (input.endTime < session.startTime) {
      throw new Error('Sleep session end time cannot precede its start time');
    }

    const updatedAt = this.now();
    const result = await this.database.runAsync(updateEndedSessionSql, [
      input.endTime,
      input.endTimeZone,
      updatedAt,
      id,
    ]);
    if (result.changes === 0) {
      throw new SessionNotFoundError(id);
    }

    return {
      ...session,
      endTime: input.endTime,
      endTimeZone: input.endTimeZone,
      updatedAt,
    };
  }

  async update(session: SleepSession): Promise<SleepSession> {
    if (session.endTime === null) {
      const active = await this.getActive();
      if (active && active.id !== session.id) {
        throw new ActiveSleepSessionError();
      }
    } else if (session.endTime < session.startTime) {
      throw new Error('Sleep session end time cannot precede its start time');
    }

    const updatedAt = this.now();
    const result = await this.database.runAsync(updateSessionSql, [
      session.tag,
      session.startTime,
      session.endTime,
      session.startTimeZone,
      session.endTimeZone,
      updatedAt,
      session.id,
    ]);
    if (result.changes === 0) {
      throw new SessionNotFoundError(session.id);
    }

    return { ...session, updatedAt };
  }

  async delete(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM sleep_sessions WHERE id = ?', [id]);
  }

  async getById(id: string): Promise<SleepSession | null> {
    const row = await this.database.getFirstAsync<SleepSessionRow>(
      'SELECT * FROM sleep_sessions WHERE id = ?',
      [id],
    );
    return row ? fromRow(row) : null;
  }

  async getActive(): Promise<SleepSession | null> {
    const row = await this.database.getFirstAsync<SleepSessionRow>(
      'SELECT * FROM sleep_sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1',
    );
    return row ? fromRow(row) : null;
  }

  async listValid(): Promise<SleepSession[]> {
    const rows = await this.database.getAllAsync<SleepSessionRow>(
      `SELECT * FROM sleep_sessions
       WHERE end_time IS NOT NULL AND end_time - start_time >= ?
       ORDER BY end_time DESC`,
      [MINIMUM_SESSION_DURATION_SECONDS * 1_000],
    );
    return rows.map(fromRow);
  }
}

export async function getSessionRepository(): Promise<SessionRepository> {
  const database = await getDatabase();
  return new SessionRepository({
    getAllAsync: (query, parameters) => database.getAllAsync(query, parameters ?? []),
    getFirstAsync: (query, parameters) => database.getFirstAsync(query, parameters ?? []),
    runAsync: (query, parameters) => database.runAsync(query, parameters ?? []),
  });
}
