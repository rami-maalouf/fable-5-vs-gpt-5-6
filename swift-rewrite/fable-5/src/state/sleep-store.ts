// app session state over the sqlite repository (zustand per the spec's stack)
// ports the sleep-relevant behavior of Utils/StrategyManager.swift's toggle
import { createStore, type StoreApi } from 'zustand/vanilla';

import { shortSleepJoke } from '../copy/jokes';
import type { SleepSession } from '../domain/models';
import { isValidSession, sessionDurationSeconds } from '../domain/session-rules';
import type { SessionRepo } from '../data/session-repo';

export interface ToggleResult {
  // set when the ended session was under 5 minutes (shown as the "Pause..." alert)
  joke: string | null;
  ended: SleepSession | null;
  started: SleepSession | null;
}

export interface SleepState {
  activeSession: SleepSession | null;
  // valid completed sessions, newest first
  sessions: SleepSession[];
  refresh: () => void;
  toggleSleep: (nowMs?: number) => ToggleResult;
  createManualLog: (input: {
    startTime: number;
    endTime: number;
    startTimeZone: string;
    endTimeZone: string;
  }) => void;
  updateSession: (
    id: string,
    input: { startTime: number; endTime: number; startTimeZone: string; endTimeZone: string }
  ) => void;
  deleteSession: (id: string) => void;
}

function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

export function createSleepStore(
  repo: SessionRepo,
  timeZone: () => string = deviceTimeZone
): StoreApi<SleepState> {
  return createStore<SleepState>((set, get) => {
    const load = () => ({
      activeSession: repo.getActiveSession(),
      sessions: repo.listValidSessions(),
    });

    return {
      ...load(),

      refresh: () => set(load()),

      toggleSleep: (nowMs = Date.now()) => {
        const result: ToggleResult = { joke: null, ended: null, started: null };
        if (get().activeSession) {
          const ended = repo.endActiveSession(timeZone(), nowMs);
          result.ended = ended;
          // short sessions stay stored but are filtered from every list;
          // ending one triggers the jokey message instead of a save celebration
          if (ended && !isValidSession(ended, nowMs)) {
            result.joke = shortSleepJoke(sessionDurationSeconds(ended, nowMs));
          }
        } else {
          result.started = repo.startSession('Sleep Mode', timeZone(), nowMs);
        }
        set(load());
        return result;
      },

      createManualLog: (input) => {
        repo.createManualLog(input);
        set(load());
      },

      updateSession: (id, input) => {
        repo.updateSession(id, input);
        set(load());
      },

      deleteSession: (id) => {
        repo.deleteSession(id);
        set(load());
      },
    };
  });
}
