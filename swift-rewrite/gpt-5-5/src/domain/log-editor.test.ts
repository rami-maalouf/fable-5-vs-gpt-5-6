// ports: twilight/views/logs/sleepsessioneditorview.swift

import type { SleepSession } from './models';
import {
  applyEditorDraftToSession,
  buildManualLogSession,
  buildSessionDatesFromEditor,
  createLogEditorDraft,
  dateKeyFromDate,
  draftFromSession,
} from './log-editor';

function session(overrides: Partial<SleepSession> = {}): SleepSession {
  return {
    id: 'existing',
    tag: 'Manual Log',
    startTime: new Date('2026-07-15T05:00:00.000Z'),
    endTime: new Date('2026-07-15T13:00:00.000Z'),
    startTimeZone: 'America/Edmonton',
    endTimeZone: 'America/Edmonton',
    createdAt: new Date('2026-07-15T14:00:00.000Z'),
    updatedAt: new Date('2026-07-15T14:00:00.000Z'),
    ...overrides,
  };
}

describe('log editor date math', () => {
  it('puts a pre-midnight bedtime on the day before the wake day', () => {
    const dates = buildSessionDatesFromEditor({
      sleepMinutes: 23 * 60,
      timeZone: 'America/Edmonton',
      wakeDayKey: '2026-07-15',
      wakeMinutes: 7 * 60,
    });

    expect(dates.startTime.toISOString()).toBe('2026-07-15T05:00:00.000Z');
    expect(dates.endTime.toISOString()).toBe('2026-07-15T13:00:00.000Z');
  });

  it('keeps a post-midnight bedtime on the wake day', () => {
    const dates = buildSessionDatesFromEditor({
      sleepMinutes: 60,
      timeZone: 'America/Edmonton',
      wakeDayKey: '2026-07-15',
      wakeMinutes: 7 * 60,
    });

    expect(dates.startTime.toISOString()).toBe('2026-07-15T07:00:00.000Z');
    expect(dates.endTime.toISOString()).toBe('2026-07-15T13:00:00.000Z');
  });

  it('creates a manual log session with stored timezone fields intact', () => {
    const manual = buildManualLogSession({
      id: 'manual-1',
      now: new Date('2026-07-16T12:00:00.000Z'),
      sleepMinutes: 22 * 60,
      timeZone: 'America/Edmonton',
      wakeDayKey: '2026-07-16',
      wakeMinutes: 6 * 60 + 30,
    });

    expect(manual).toMatchObject({
      id: 'manual-1',
      tag: 'Manual Log',
      startTimeZone: 'America/Edmonton',
      endTimeZone: 'America/Edmonton',
      createdAt: new Date('2026-07-16T12:00:00.000Z'),
      updatedAt: new Date('2026-07-16T12:00:00.000Z'),
    });
    expect(manual.startTime.toISOString()).toBe('2026-07-16T04:00:00.000Z');
    expect(manual.endTime?.toISOString()).toBe('2026-07-16T12:30:00.000Z');
  });

  it('hydrates an editor draft from an existing session using stored timezones', () => {
    const draft = draftFromSession(
      session({
        startTime: new Date('2026-07-15T06:30:00.000Z'),
        endTime: new Date('2026-07-15T13:15:00.000Z'),
        startTimeZone: 'America/Edmonton',
        endTimeZone: 'America/Edmonton',
      }),
    );

    expect(draft).toEqual({
      id: 'existing',
      sleepMinutes: 30,
      timeZone: 'America/Edmonton',
      wakeDayKey: '2026-07-15',
      wakeMinutes: 7 * 60 + 15,
    });
  });

  it('applies editor changes without replacing creation metadata', () => {
    const createdAt = new Date('2026-07-15T14:00:00.000Z');
    const updatedAt = new Date('2026-07-16T14:00:00.000Z');
    const updated = applyEditorDraftToSession(
      session({ createdAt, tag: null }),
      {
        id: 'existing',
        sleepMinutes: 23 * 60,
        timeZone: 'America/Edmonton',
        wakeDayKey: '2026-07-16',
        wakeMinutes: 7 * 60,
      },
      updatedAt,
    );

    expect(updated).toMatchObject({
      createdAt,
      endTimeZone: 'America/Edmonton',
      id: 'existing',
      startTimeZone: 'America/Edmonton',
      tag: 'Manual Log',
      updatedAt,
    });
    expect(updated.startTime.toISOString()).toBe('2026-07-16T05:00:00.000Z');
    expect(updated.endTime?.toISOString()).toBe('2026-07-16T13:00:00.000Z');
  });

  it('creates a new editor draft from defaults and a selected wake day', () => {
    expect(
      createLogEditorDraft({
        sleepMinutes: 22 * 60,
        timeZone: 'America/Edmonton',
        wakeDayKey: '2026-07-15',
        wakeMinutes: 7 * 60,
      }),
    ).toEqual({
      sleepMinutes: 22 * 60,
      timeZone: 'America/Edmonton',
      wakeDayKey: '2026-07-15',
      wakeMinutes: 7 * 60,
    });
  });

  it('formats a date key in a target timezone', () => {
    expect(dateKeyFromDate(new Date('2026-07-16T03:00:00.000Z'), 'America/Edmonton')).toBe('2026-07-15');
    expect(dateKeyFromDate(new Date('2026-07-16T03:00:00.000Z'), 'Asia/Tokyo')).toBe('2026-07-16');
  });
});
