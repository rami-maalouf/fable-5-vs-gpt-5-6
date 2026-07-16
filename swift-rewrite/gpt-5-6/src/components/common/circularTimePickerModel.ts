const minutesPerDay = 24 * 60;
const snapDegrees = 1.25;
const grabThresholdDegrees = 35;

export type TimePickerKnob = 'sleep' | 'wake';

export interface ArcSegment {
  startAngle: number;
  sweepAngle: number;
}

export interface DurationQuality {
  isHealthy: boolean;
  message: 'Add more sleep' | 'Almost ideal' | 'Perfect amount!' | 'Extra rest time';
}

export function minutesToAngle(minutes: number): number {
  return (normalizeMinutes(minutes) / minutesPerDay) * 360;
}

export function pointToAngle(x: number, y: number, centerX: number, centerY: number): number {
  return normalizeAngle((Math.atan2(y - centerY, x - centerX) * 180) / Math.PI + 90);
}

export function angleToSnappedMinutes(angle: number): number {
  const snappedAngle = Math.round(normalizeAngle(angle) / snapDegrees) * snapDegrees;
  return normalizeMinutes((snappedAngle / 360) * minutesPerDay);
}

export function pickClosestKnob(
  touchAngle: number,
  sleepAngle: number,
  wakeAngle: number,
): TimePickerKnob | null {
  const sleepDistance = angularDistance(touchAngle, sleepAngle);
  const wakeDistance = angularDistance(touchAngle, wakeAngle);
  const closest = Math.min(sleepDistance, wakeDistance);
  if (closest > grabThresholdDegrees) {
    return null;
  }
  return sleepDistance <= wakeDistance ? 'sleep' : 'wake';
}

export function getArcSegments(sleepMinutes: number, wakeMinutes: number): ArcSegment[] {
  const startAngle = minutesToAngle(sleepMinutes);
  const endAngle = minutesToAngle(wakeMinutes);
  if (endAngle > startAngle) {
    return [{ startAngle, sweepAngle: endAngle - startAngle }];
  }
  if (endAngle === startAngle) {
    return [];
  }
  return [
    { startAngle, sweepAngle: 360 - startAngle },
    { startAngle: 0, sweepAngle: endAngle },
  ];
}

export function sleepDurationMinutes(sleepMinutes: number, wakeMinutes: number): number {
  return normalizeMinutes(wakeMinutes - sleepMinutes);
}

export function durationQuality(durationMinutes: number): DurationQuality {
  if (durationMinutes < 6 * 60) {
    return { isHealthy: false, message: 'Add more sleep' };
  }
  if (durationMinutes < 7 * 60) {
    return { isHealthy: false, message: 'Almost ideal' };
  }
  if (durationMinutes <= 9 * 60) {
    return { isHealthy: true, message: 'Perfect amount!' };
  }
  return { isHealthy: false, message: 'Extra rest time' };
}

function angularDistance(left: number, right: number): number {
  const difference = Math.abs(normalizeAngle(left) - normalizeAngle(right));
  return Math.min(difference, 360 - difference);
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function normalizeMinutes(minutes: number): number {
  return ((Math.round(minutes) % minutesPerDay) + minutesPerDay) % minutesPerDay;
}
