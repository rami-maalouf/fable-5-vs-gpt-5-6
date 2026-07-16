import type { SleepSession } from '@/domain/models';

const minutesPerDay = 24 * 60;
const formatterCache = new Map<string, Intl.DateTimeFormat>();

export interface LogEditorValue {
  endTimeZone: string;
  sleepMinutes: number;
  startTimeZone: string;
  wakeDayKey: string;
  wakeMinutes: number;
}

type EditorTimestampsInput = LogEditorValue;

export function createEditorValueFromSession(session: SleepSession): LogEditorValue {
  if (session.endTime === null) {
    throw new Error(`Cannot edit active session ${session.id}`);
  }
  const endTimeZone = session.endTimeZone ?? session.startTimeZone;
  return {
    endTimeZone,
    sleepMinutes: minuteOfDay(session.startTime, session.startTimeZone),
    startTimeZone: session.startTimeZone,
    wakeDayKey: dayKey(session.endTime, endTimeZone),
    wakeMinutes: minuteOfDay(session.endTime, endTimeZone),
  };
}

export function buildEditorTimestamps(input: EditorTimestampsInput) {
  const startDayKey =
    normalizeMinutes(input.sleepMinutes) > normalizeMinutes(input.wakeMinutes)
      ? shiftDayKey(input.wakeDayKey, -1)
      : input.wakeDayKey;
  return {
    endTime: zonedMinuteToTimestamp(
      input.wakeDayKey,
      input.wakeMinutes,
      input.endTimeZone,
    ),
    startTime: zonedMinuteToTimestamp(
      startDayKey,
      input.sleepMinutes,
      input.startTimeZone,
    ),
  };
}

export function zonedMinuteToTimestamp(
  targetDayKey: string,
  minute: number,
  timeZone: string,
): number {
  const [year, month, day] = parseDayKey(targetDayKey);
  const normalizedMinute = normalizeMinutes(minute);
  const hour = Math.floor(normalizedMinute / 60);
  const minuteOfHour = normalizedMinute % 60;
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minuteOfHour);
  let candidate = targetAsUtc;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const parts = zonedParts(candidate, timeZone);
    const candidateWallTimeAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    const difference = targetAsUtc - candidateWallTimeAsUtc;
    if (difference === 0) {
      while (matchesWallTime(candidate - 60 * 60 * 1_000, targetDayKey, normalizedMinute, timeZone)) {
        candidate -= 60 * 60 * 1_000;
      }
      return candidate;
    }
    candidate += difference;
  }

  throw new Error(`${targetDayKey} ${formatMinute(normalizedMinute)} does not exist in ${timeZone}`);
}

export function dayKeyFromPickerDate(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((value, index) => (index === 0 ? String(value) : String(value).padStart(2, '0')))
    .join('-');
}

export function pickerDateFromDayKey(value: string): Date {
  const [year, month, day] = parseDayKey(value);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function matchesWallTime(
  timestamp: number,
  targetDayKey: string,
  targetMinute: number,
  timeZone: string,
): boolean {
  return dayKey(timestamp, timeZone) === targetDayKey && minuteOfDay(timestamp, timeZone) === targetMinute;
}

function zonedParts(timestamp: number, timeZone: string) {
  const parts = formatter(timeZone).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    day: Number(values.day),
    hour: Number(values.hour) % 24,
    minute: Number(values.minute),
    month: Number(values.month),
    year: Number(values.year),
  };
}

function formatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) {
    return cached;
  }
  const created = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  });
  formatterCache.set(timeZone, created);
  return created;
}

function dayKey(timestamp: number, timeZone: string): string {
  const parts = zonedParts(timestamp, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function minuteOfDay(timestamp: number, timeZone: string): number {
  const parts = zonedParts(timestamp, timeZone);
  return parts.hour * 60 + parts.minute;
}

function shiftDayKey(value: string, days: number): string {
  const [year, month, day] = parseDayKey(value);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

function parseDayKey(value: string): [number, number, number] {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid wake day: ${value}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function normalizeMinutes(value: number): number {
  return ((Math.round(value) % minutesPerDay) + minutesPerDay) % minutesPerDay;
}

function formatMinute(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
