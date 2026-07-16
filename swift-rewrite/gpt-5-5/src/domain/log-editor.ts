// ports: twilight/views/logs/sleepsessioneditorview.swift

import type { SleepSession } from './models';
import { getWakeDayKey, makeDateInTimeZone, minutesSinceStartOfDay } from './session-rules';

export type LogEditorDraft = {
  id?: string;
  wakeDayKey: string;
  sleepMinutes: number;
  wakeMinutes: number;
  timeZone: string;
};

export type SessionDatesFromEditorInput = {
  wakeDayKey: string;
  sleepMinutes: number;
  wakeMinutes: number;
  timeZone: string;
};

export type ManualLogSessionInput = SessionDatesFromEditorInput & {
  id: string;
  now: Date;
};

const noonMinutes = 12 * 60;

export function createLogEditorDraft({
  sleepMinutes,
  timeZone,
  wakeDayKey,
  wakeMinutes,
}: SessionDatesFromEditorInput): LogEditorDraft {
  return {
    sleepMinutes,
    timeZone,
    wakeDayKey,
    wakeMinutes,
  };
}

export function draftFromSession(session: SleepSession): LogEditorDraft {
  const endTimeZone = session.endTimeZone ?? session.startTimeZone;
  const endTime = session.endTime ?? session.startTime;

  return {
    id: session.id,
    sleepMinutes: minutesSinceStartOfDay(session.startTime, endTimeZone),
    timeZone: endTimeZone,
    wakeDayKey: getWakeDayKey({ ...session, endTime, endTimeZone }),
    wakeMinutes: minutesSinceStartOfDay(endTime, endTimeZone),
  };
}

export function buildSessionDatesFromEditor({
  sleepMinutes,
  timeZone,
  wakeDayKey,
  wakeMinutes,
}: SessionDatesFromEditorInput) {
  const sleepDayKey = sleepMinutes < noonMinutes ? wakeDayKey : addDaysToDateKey(wakeDayKey, -1);
  const sleepHour = Math.floor(sleepMinutes / 60);
  const sleepMinute = sleepMinutes % 60;
  const wakeHour = Math.floor(wakeMinutes / 60);
  const wakeMinute = wakeMinutes % 60;

  return {
    startTime: makeDateInTimeZone(sleepDayKey, sleepHour, sleepMinute, timeZone),
    endTime: makeDateInTimeZone(wakeDayKey, wakeHour, wakeMinute, timeZone),
  };
}

export function buildManualLogSession(input: ManualLogSessionInput): SleepSession {
  const { endTime, startTime } = buildSessionDatesFromEditor(input);

  return {
    id: input.id,
    tag: 'Manual Log',
    startTime,
    endTime,
    startTimeZone: input.timeZone,
    endTimeZone: input.timeZone,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function applyEditorDraftToSession(session: SleepSession, draft: LogEditorDraft, now: Date): SleepSession {
  const { endTime, startTime } = buildSessionDatesFromEditor(draft);

  return {
    ...session,
    tag: session.tag ?? 'Manual Log',
    startTime,
    endTime,
    startTimeZone: draft.timeZone,
    endTimeZone: draft.timeZone,
    updatedAt: now,
  };
}

export function dateKeyFromDate(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      calendar: 'iso8601',
      day: '2-digit',
      month: '2-digit',
      timeZone,
      year: 'numeric',
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));
  const shiftedYear = shifted.getUTCFullYear();
  const shiftedMonth = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const shiftedDay = String(shifted.getUTCDate()).padStart(2, '0');

  return `${shiftedYear}-${shiftedMonth}-${shiftedDay}`;
}
