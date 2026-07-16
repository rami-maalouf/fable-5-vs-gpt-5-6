// shared x-scale helpers for date-series charts (metrics + dashboard cards):
// calendar days map to evenly spaced day indexes like swift charts' .day unit
import type { CalendarDay } from '@/domain/models';
import { diffDays } from '@/domain/session-rules';

export function dayIndexes(dates: readonly CalendarDay[]): number[] {
  if (dates.length === 0) return [];
  const first = dates[0];
  return dates.map((d) => diffDays(first, d));
}

export function formatMonthDay(day: CalendarDay): string {
  return new Date(Date.UTC(day.year, day.month - 1, day.day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatAbbrevDate(day: CalendarDay): string {
  return new Date(Date.UTC(day.year, day.month - 1, day.day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// ~5 x-axis tick indexes like AxisMarks(values: .automatic(desiredCount: 5))
export function xTickIndexes(count: number, desired = 5): number[] {
  if (count === 0) return [];
  if (count <= desired) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (desired - 1);
  return Array.from({ length: desired }, (_, i) => Math.round(i * step));
}
