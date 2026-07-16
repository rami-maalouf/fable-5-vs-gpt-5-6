// ports: twilight/views/logs/sleepsessioneditorview.swift

import { makeDateInTimeZone } from '@/domain/session-rules';

export function formatEditorClockTime(minutes: number) {
  const hour24 = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';

  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function formatEditorDateLabel(dateKey: string, timeZone: string) {
  const date = makeDateInTimeZone(dateKey, 12, 0, timeZone);

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    timeZone,
    weekday: 'long',
  }).format(date);
}
