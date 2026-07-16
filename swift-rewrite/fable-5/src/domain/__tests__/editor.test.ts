// ports behavior of: Views/Logs/SleepSessionEditorView.swift (day sync + save)
import {
  editorTimesFromSession,
  epochFromDayMinutes,
  resolveEditorDays,
} from '../editor';
import type { SleepSession } from '../models';

describe('resolveEditorDays (sleep-day sync + wake crossover)', () => {
  const wakeDay = { year: 2025, month: 1, day: 15 };

  test('pre-midnight bedtime lands on the previous day (23:00 -> 07:00)', () => {
    const r = resolveEditorDays(wakeDay, 23 * 60, 7 * 60);
    expect(r.sleepDay).toEqual({ year: 2025, month: 1, day: 14 });
    expect(r.wakeDayFinal).toEqual(wakeDay);
  });

  test('post-midnight bedtime shares the wake day (01:00 -> 07:00)', () => {
    const r = resolveEditorDays(wakeDay, 1 * 60, 7 * 60);
    expect(r.sleepDay).toEqual(wakeDay);
    expect(r.wakeDayFinal).toEqual(wakeDay);
  });

  test('afternoon bedtime with morning wake crosses midnight (13:00 -> 09:00)', () => {
    const r = resolveEditorDays(wakeDay, 13 * 60, 9 * 60);
    expect(r.sleepDay).toEqual({ year: 2025, month: 1, day: 14 });
    expect(r.wakeDayFinal).toEqual(wakeDay);
  });

  test('daytime nap stays inside one day (13:00 -> 15:00)', () => {
    const r = resolveEditorDays(wakeDay, 13 * 60, 15 * 60);
    expect(r.sleepDay).toEqual({ year: 2025, month: 1, day: 14 });
    expect(r.wakeDayFinal).toEqual({ year: 2025, month: 1, day: 14 });
  });
});

describe('epochFromDayMinutes (wall clock -> instant in a timezone)', () => {
  test('denver winter time', () => {
    // 2025-01-15 23:00 mst = 2025-01-16 06:00 utc
    expect(epochFromDayMinutes({ year: 2025, month: 1, day: 15 }, 23 * 60, 'America/Denver')).toBe(
      Date.UTC(2025, 0, 16, 6, 0)
    );
  });

  test('denver summer time (dst)', () => {
    // 2025-07-15 23:00 mdt = 2025-07-16 05:00 utc
    expect(epochFromDayMinutes({ year: 2025, month: 7, day: 15 }, 23 * 60, 'America/Denver')).toBe(
      Date.UTC(2025, 6, 16, 5, 0)
    );
  });

  test('tokyo (no dst, +9)', () => {
    expect(epochFromDayMinutes({ year: 2025, month: 3, day: 10 }, 6 * 60, 'Asia/Tokyo')).toBe(
      Date.UTC(2025, 2, 9, 21, 0)
    );
  });
});

describe('editorTimesFromSession (display wall-clock in the stored tz)', () => {
  test('reads start/end minutes and wake day in the session timezones', () => {
    const session: SleepSession = {
      id: 'x',
      tag: 'Manual Log',
      // 22:30 jan 14 denver -> 06:30 jan 15 denver
      startTime: Date.UTC(2025, 0, 15, 5, 30),
      endTime: Date.UTC(2025, 0, 15, 13, 30),
      startTimeZone: 'America/Denver',
      endTimeZone: 'America/Denver',
      createdAt: 0,
      updatedAt: 0,
    };
    const r = editorTimesFromSession(session);
    expect(r.sleepMinutes).toBe(22 * 60 + 30);
    expect(r.wakeMinutes).toBe(6 * 60 + 30);
    expect(r.wakeDay).toEqual({ year: 2025, month: 1, day: 15 });
  });
});

describe('round trip: edit an existing session and save in its timezones', () => {
  test('editing preserves timezone correctness', () => {
    const session: SleepSession = {
      id: 'x',
      tag: 'Manual Log',
      startTime: Date.UTC(2025, 0, 15, 5, 30),
      endTime: Date.UTC(2025, 0, 15, 13, 30),
      startTimeZone: 'America/Denver',
      endTimeZone: 'America/Denver',
      createdAt: 0,
      updatedAt: 0,
    };
    const { wakeDay, sleepMinutes, wakeMinutes } = editorTimesFromSession(session);
    const { sleepDay, wakeDayFinal } = resolveEditorDays(wakeDay, sleepMinutes, wakeMinutes);
    // saving unchanged values reproduces the stored instants
    expect(epochFromDayMinutes(sleepDay, sleepMinutes, session.startTimeZone)).toBe(
      session.startTime
    );
    expect(epochFromDayMinutes(wakeDayFinal, wakeMinutes, session.endTimeZone!)).toBe(
      session.endTime
    );
  });
});
