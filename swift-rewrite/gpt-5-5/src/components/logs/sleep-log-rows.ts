import type { SleepSession } from '@/domain/models';
import { durationSeconds, getWakeDayKey, isValidSleepSession } from '@/domain/session-rules';

export type SleepLogRowModel = {
  id: string;
  wakeDayKey: string;
  dayLabel: string;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
};

function formatDay(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      timeZone,
      weekday: 'short',
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return `${parts.weekday} ${parts.day} ${parts.month}`;
}

function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date);
}

function compareSessionEndDescending(left: SleepSession, right: SleepSession) {
  return (right.endTime?.getTime() ?? 0) - (left.endTime?.getTime() ?? 0);
}

export function buildSleepLogRows(sessions: readonly SleepSession[]): SleepLogRowModel[] {
  return sessions
    .filter(isValidSleepSession)
    .slice()
    .sort(compareSessionEndDescending)
    .map((session) => {
      const endTime = session.endTime as Date;
      const endTimeZone = session.endTimeZone ?? session.startTimeZone;

      return {
        id: session.id,
        wakeDayKey: getWakeDayKey(session),
        dayLabel: formatDay(endTime, endTimeZone),
        startLabel: formatTime(session.startTime, session.startTimeZone),
        endLabel: formatTime(endTime, endTimeZone),
        durationLabel: formatLogDuration(durationSeconds(session)),
      };
    });
}

export function formatLogDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
}
