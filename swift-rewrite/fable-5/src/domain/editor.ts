// ports: Views/Logs/SleepSessionEditorView.swift - day sync + save date math
// pure ts - no react or expo imports
import type { CalendarDay, SleepSession } from './models';
import { addDays, resolveEndTimeZone, wakeDay, zonedParts } from './session-rules';

// sleep time before noon = post-midnight sleep (same day as wake);
// noon or later = pre-midnight sleep (previous day). if the wake time-of-day
// is earlier than the sleep time-of-day, waking crosses into the next day.
export function resolveEditorDays(
  wakeDaySelected: CalendarDay,
  sleepMinutes: number,
  wakeMinutes: number
): { sleepDay: CalendarDay; wakeDayFinal: CalendarDay } {
  const sleepDay = sleepMinutes < 12 * 60 ? wakeDaySelected : addDays(wakeDaySelected, -1);
  const wakeDayFinal = wakeMinutes < sleepMinutes ? addDays(sleepDay, 1) : sleepDay;
  return { sleepDay, wakeDayFinal };
}

// converts a wall-clock (day, minutes-since-midnight) in an iana timezone to an
// epoch instant. two-pass offset correction handles dst transitions.
export function epochFromDayMinutes(
  day: CalendarDay,
  minutesSinceMidnight: number,
  timeZone: string
): number {
  const hour = Math.trunc(minutesSinceMidnight / 60);
  const minute = minutesSinceMidnight % 60;
  let guess = Date.UTC(day.year, day.month - 1, day.day, hour, minute);
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(guess, timeZone);
    const actual = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    const desired = Date.UTC(day.year, day.month - 1, day.day, hour, minute);
    const diff = desired - actual;
    if (diff === 0) break;
    guess += diff;
  }
  return guess;
}

// what the picker should display for an existing session: wall-clock times in
// the session's own timezones (pickerDisplayDate equivalent)
export function editorTimesFromSession(session: SleepSession): {
  wakeDay: CalendarDay;
  sleepMinutes: number;
  wakeMinutes: number;
} {
  const start = zonedParts(session.startTime, session.startTimeZone);
  const endTz = resolveEndTimeZone(session);
  const end = zonedParts(session.endTime ?? session.startTime, endTz);
  return {
    wakeDay: wakeDay(session),
    sleepMinutes: start.hour * 60 + start.minute,
    wakeMinutes: end.hour * 60 + end.minute,
  };
}
