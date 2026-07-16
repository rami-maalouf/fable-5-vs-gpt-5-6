// ports: Views/SleepDataModels.swift (SleepDataUtils) - chart data math
// pure ts - no react or expo imports
import { zonedParts } from '../session-rules';

// time-of-day offsets are computed against an 18:00 base hour so bedtimes
// crossing midnight sort correctly
export const BASE_HOUR = 18;

export interface DailySleepDatum {
  startOffset: number;
  endOffset: number;
  durationSeconds: number;
}

// ports calculateTimeOffset for a wall-clock time expressed in minutes since midnight
export function timeOffsetFromMinutes(minutesSinceMidnight: number): number {
  let hour = minutesSinceMidnight / 60;
  if (hour < BASE_HOUR) hour += 24;
  return hour - BASE_HOUR;
}

// ports calculateTimeOffset(for:timeZone:) for an instant in a timezone
export function timeOffsetOfInstant(epochMs: number, timeZone: string): number {
  const p = zonedParts(epochMs, timeZone);
  return timeOffsetFromMinutes(p.hour * 60 + p.minute);
}

// ports calculateYAxisDomain: tight min/max over active data + optimal offsets;
// defaults to 10pm-8am when there is nothing to show
export function calculateYAxisDomain(
  data: readonly DailySleepDatum[],
  optimalSleepMinutes: number | null,
  optimalWakeMinutes: number | null
): { min: number; max: number } {
  const active = data.filter((d) => d.durationSeconds > 0);
  const values = active.flatMap((d) => [d.startOffset, d.endOffset]);
  if (optimalSleepMinutes != null) values.push(timeOffsetFromMinutes(optimalSleepMinutes));
  if (optimalWakeMinutes != null) values.push(timeOffsetFromMinutes(optimalWakeMinutes));
  if (values.length === 0) return { min: 4, max: 14 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

// ports normalizedDurationY: maps a duration in hours (0..12) onto the negated
// offset domain so the duration line shares the bar chart's y scale
export function normalizedDurationY(hours: number, minY: number, maxY: number): number {
  const top = -minY;
  const bottom = -maxY;
  return bottom + (hours / 12) * (top - bottom);
}

// ports formatTimeLabel: offset 0 = 6 PM, 6 = 12 AM, 18 = 12 PM
export function formatTimeLabel(offset: number): string {
  let hour = Math.trunc(BASE_HOUR + offset);
  if (hour >= 24) hour -= 24;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour} ${ampm}`;
}

// ports formatDurationShort: decimal hours with one fraction digit
export function formatDurationShort(durationSeconds: number): string {
  return (durationSeconds / 3600).toFixed(1);
}
