import type { SleepSession } from './models';

export const MINIMUM_VALID_SESSION_SECONDS = 300;

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

type GoalMatchInput = {
  sleepDate: Date;
  wakeDate: Date;
  sleepTargetMinutes: number;
  wakeTargetMinutes: number;
  timeZone?: string;
};

type GoalMatch = {
  averageDeviationMinutes: number;
  score: number;
  subtitle: string;
};

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function zonedFormatter(timeZone: string) {
  const cached = dateTimeFormatters.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    calendar: 'iso8601',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  });

  dateTimeFormatters.set(timeZone, formatter);
  return formatter;
}

function getZonedParts(date: Date, timeZone: string): ZonedDateParts {
  const parts = Object.fromEntries(
    zonedFormatter(timeZone)
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour === 24 ? 0 : parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

export function isActiveSession(session: SleepSession) {
  return session.endTime == null;
}

export function durationSeconds(session: SleepSession, now = new Date()) {
  const endTime = session.endTime ?? now;
  return Math.max(0, Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000));
}

export function isValidSleepSession(session: SleepSession) {
  return session.endTime != null && durationSeconds(session) >= MINIMUM_VALID_SESSION_SECONDS;
}

export function getWakeDayKey(session: SleepSession) {
  const endTime = session.endTime ?? new Date(session.startTime.getTime() + 24 * 60 * 60 * 1000);
  const endTimeZone = session.endTimeZone ?? session.startTimeZone;
  const parts = getZonedParts(endTime, endTimeZone);

  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
}

export function canonicalSessionsByWakeDay(sessions: readonly SleepSession[]) {
  const bestByWakeDay = new Map<string, SleepSession>();
  const validSessions = sessions
    .filter(isValidSleepSession)
    .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());

  for (const session of validSessions) {
    const wakeDay = getWakeDayKey(session);
    const existing = bestByWakeDay.get(wakeDay);

    if (!existing || durationSeconds(session) > durationSeconds(existing)) {
      bestByWakeDay.set(wakeDay, session);
    }
  }

  return Array.from(bestByWakeDay.values()).sort((left, right) => getWakeDayKey(left).localeCompare(getWakeDayKey(right)));
}

export function minutesSinceStartOfDay(date: Date, timeZone = 'UTC') {
  const parts = getZonedParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

export function wrappedMinuteDifference(leftMinutes: number, rightMinutes: number) {
  const rawDifference = Math.abs(leftMinutes - rightMinutes) % (24 * 60);
  return Math.min(rawDifference, 24 * 60 - rawDifference);
}

export function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
}

export function formatGoalMatch({
  sleepDate,
  wakeDate,
  sleepTargetMinutes,
  wakeTargetMinutes,
  timeZone = 'UTC',
}: GoalMatchInput): GoalMatch {
  const sleepActual = minutesSinceStartOfDay(sleepDate, timeZone);
  const wakeActual = minutesSinceStartOfDay(wakeDate, timeZone);
  const totalDeviation =
    wrappedMinuteDifference(sleepActual, sleepTargetMinutes) + wrappedMinuteDifference(wakeActual, wakeTargetMinutes);
  const averageDeviationMinutes = Math.floor(totalDeviation / 2);
  const deduction = Math.floor((averageDeviationMinutes / 60) * 30);
  const score = Math.max(0, 100 - deduction);

  if (averageDeviationMinutes === 0) {
    return { averageDeviationMinutes, score, subtitle: 'Exactly on target' };
  }

  if (averageDeviationMinutes <= 5) {
    return { averageDeviationMinutes, score, subtitle: 'Within 5 min' };
  }

  return { averageDeviationMinutes, score, subtitle: `${averageDeviationMinutes}m avg off goal` };
}

export function makeDateInTimeZone(dateKey: string, hour: number, minute: number, timeZone: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const guessParts = getZonedParts(utcGuess, timeZone);
  const offsetMs =
    Date.UTC(guessParts.year, guessParts.month - 1, guessParts.day, guessParts.hour, guessParts.minute, guessParts.second) -
    utcGuess.getTime();

  return new Date(utcGuess.getTime() - offsetMs);
}
