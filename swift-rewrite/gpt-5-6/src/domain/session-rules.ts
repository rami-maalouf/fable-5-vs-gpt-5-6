// ports: twilight/models/blockedprofilesessions.swift, twilight/views/logs/sleepsessioneditorview.swift

import type { SleepSession } from './models';

export const MINIMUM_SESSION_DURATION_SECONDS = 300;

const millisecondsPerHour = 60 * 60 * 1_000;
const minutesPerDay = 24 * 60;
const dayFormatterByTimeZone = new Map<string, Intl.DateTimeFormat>();

interface GoalMatchInput {
  sleepMinutes: number;
  wakeMinutes: number;
  targetSleepMinutes: number;
  targetWakeMinutes: number;
}

export interface GoalMatch {
  averageDeviationMinutes: number;
  score: number;
}

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = dayFormatterByTimeZone.get(timeZone);
  if (cached) {
    return cached;
  }

  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      month: '2-digit',
      timeZone,
      year: 'numeric',
    });
  } catch {
    throw new Error(`Invalid IANA time zone: ${timeZone}`);
  }

  dayFormatterByTimeZone.set(timeZone, formatter);
  return formatter;
}

function dayKeyAt(timestamp: number, timeZone: string): string {
  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  const parts = dayFormatter(timeZone).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function completedEndTime(session: SleepSession): number {
  if (session.endTime === null) {
    throw new Error(`Session ${session.id} is still active`);
  }
  return session.endTime;
}

function wakeTimeZone(session: SleepSession): string {
  return session.endTimeZone ?? session.startTimeZone;
}

function normalizedMinuteOfDay(minutes: number): number {
  if (!Number.isFinite(minutes)) {
    throw new Error(`Invalid minutes since midnight: ${minutes}`);
  }

  return ((Math.trunc(minutes) % minutesPerDay) + minutesPerDay) % minutesPerDay;
}

function wrappedMinuteDifference(left: number, right: number): number {
  const difference = Math.abs(normalizedMinuteOfDay(left) - normalizedMinuteOfDay(right));
  return Math.min(difference, minutesPerDay - difference);
}

function shouldReplaceCanonical(candidate: SleepSession, current: SleepSession): boolean {
  const candidateDuration = getSessionDurationSeconds(candidate) ?? 0;
  const currentDuration = getSessionDurationSeconds(current) ?? 0;

  if (candidateDuration !== currentDuration) {
    return candidateDuration > currentDuration;
  }
  if (candidate.startTime !== current.startTime) {
    return candidate.startTime < current.startTime;
  }
  return candidate.id.localeCompare(current.id) < 0;
}

export function getSessionDurationSeconds(session: SleepSession): number | null {
  if (session.endTime === null) {
    return null;
  }
  return (session.endTime - session.startTime) / 1_000;
}

export function isActiveSleepSession(session: SleepSession): boolean {
  return session.endTime === null;
}

export function isValidSleepSession(session: SleepSession): boolean {
  const duration = getSessionDurationSeconds(session);
  return duration !== null && Number.isFinite(duration) && duration >= MINIMUM_SESSION_DURATION_SECONDS;
}

export function getWakeDayKey(session: SleepSession): string {
  return dayKeyAt(completedEndTime(session), wakeTimeZone(session));
}

export function startOfDayInTimeZone(timestamp: number, timeZone: string): number {
  const targetDay = dayKeyAt(timestamp, timeZone);
  const [year, month, day] = targetDay.split('-').map(Number);
  const approximateMidnight = Date.UTC(year, month - 1, day);
  let lowerBound = approximateMidnight - 36 * millisecondsPerHour;
  let upperBound = approximateMidnight + 36 * millisecondsPerHour;

  while (lowerBound < upperBound) {
    const midpoint = lowerBound + Math.floor((upperBound - lowerBound) / 2);
    if (dayKeyAt(midpoint, timeZone) < targetDay) {
      lowerBound = midpoint + 1;
    } else {
      upperBound = midpoint;
    }
  }

  if (dayKeyAt(lowerBound, timeZone) !== targetDay) {
    throw new Error(`Unable to resolve start of ${targetDay} in ${timeZone}`);
  }
  return lowerBound;
}

export function selectCanonicalSessionsByWakeDay(
  sessions: readonly SleepSession[],
): Map<string, SleepSession> {
  const canonicalByWakeDay = new Map<string, SleepSession>();

  for (const session of sessions) {
    if (!isValidSleepSession(session)) {
      continue;
    }

    const wakeDay = getWakeDayKey(session);
    const current = canonicalByWakeDay.get(wakeDay);
    if (!current || shouldReplaceCanonical(session, current)) {
      canonicalByWakeDay.set(wakeDay, session);
    }
  }

  return canonicalByWakeDay;
}

export function formatDuration(durationSeconds: number): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    throw new Error(`Invalid duration: ${durationSeconds}`);
  }

  const totalMinutes = Math.floor(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function calculateGoalMatch(input: GoalMatchInput): GoalMatch {
  const totalDeviation =
    wrappedMinuteDifference(input.sleepMinutes, input.targetSleepMinutes) +
    wrappedMinuteDifference(input.wakeMinutes, input.targetWakeMinutes);
  const averageDeviationMinutes = Math.floor(totalDeviation / 2);
  const deduction = Math.floor((averageDeviationMinutes / 60) * 30);

  return {
    averageDeviationMinutes,
    score: Math.max(0, 100 - deduction),
  };
}

export function formatGoalMatchScore(score: number): string {
  return `${Math.max(0, Math.min(100, Math.round(score)))}%`;
}

export function formatGoalMatchSubtitle(averageDeviationMinutes: number): string {
  const deviation = Math.max(0, Math.trunc(averageDeviationMinutes));
  if (deviation === 0) {
    return 'Exactly on target';
  }
  if (deviation <= 5) {
    return 'Within 5 min';
  }
  return `${deviation}m avg off goal`;
}
