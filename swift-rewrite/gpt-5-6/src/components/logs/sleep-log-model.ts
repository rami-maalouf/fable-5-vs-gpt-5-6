import type { SleepSession } from '@/domain/models';

export interface SleepLogRowModel {
  dateLabel: string;
  durationLabel: string;
  endLabel: string;
  id: string;
  startLabel: string;
}

export function createSleepLogRow(session: SleepSession): SleepLogRowModel {
  if (session.endTime === null) {
    throw new Error(`Cannot create a log row for active session ${session.id}`);
  }
  const timeZone = session.endTimeZone ?? session.startTimeZone;
  const durationMinutes = Math.floor((session.endTime - session.startTime) / 60_000);
  return {
    dateLabel: formatDate(session.endTime, timeZone),
    durationLabel: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
    endLabel: formatTime(session.endTime, timeZone),
    id: session.id,
    startLabel: formatTime(session.startTime, timeZone),
  };
}

function formatDate(timestamp: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone,
    weekday: 'short',
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.weekday}, ${values.month} ${values.day}`;
}

function formatTime(timestamp: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
    timeZone,
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.hour}:${values.minute} ${values.dayPeriod}`;
}
