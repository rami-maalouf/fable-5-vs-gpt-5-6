// ports: Components/Common/OnboardingCircularTimePicker.swift (drag + angle math)
// pure ts - no react or expo imports

// 0 degrees = midnight at the 12 o'clock position; full turn = 24 hours
export function angleFromMinutes(minutesSinceMidnight: number): number {
  return (minutesSinceMidnight / (24 * 60)) * 360;
}

// swift truncates via Int() casts; the (24 * 60) grouping matters for ieee754
// parity with the original's `(angle / 360) * (24 * 60)`
export function minutesFromAngle(angle: number): number {
  const totalMinutes = (angle / 360) * (24 * 60);
  return Math.trunc(totalMinutes);
}

// atan2 pointer angle mapped so up = 0, wrapped to 0..360
export function pointerAngle(dx: number, dy: number): number {
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  return deg;
}

// shortest signed angular distance, wrapped to -180..180
export function angleDifference(angle1: number, angle2: number): number {
  let diff = angle1 - angle2;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

// snap to 5-minute intervals (1.25 degrees)
export function snapAngle(angle: number, step = 1.25): number {
  return Math.round(angle / step) * step;
}

// 35-degree grab threshold; the nearest knob wins
export function grabTarget(
  pointerDeg: number,
  sleepAngle: number,
  wakeAngle: number,
  threshold = 35
): 'sleep' | 'wake' | null {
  const sleepDist = Math.abs(angleDifference(pointerDeg, sleepAngle));
  const wakeDist = Math.abs(angleDifference(pointerDeg, wakeAngle));
  if (sleepDist < threshold && sleepDist < wakeDist) return 'sleep';
  if (wakeDist < threshold) return 'wake';
  return null;
}

export function durationFromAngles(
  sleepAngle: number,
  wakeAngle: number
): { hours: number; minutes: number } {
  let diff = wakeAngle - sleepAngle;
  if (diff < 0) diff += 360;
  const totalMinutes = Math.trunc((diff / 360) * (24 * 60));
  return { hours: Math.trunc(totalMinutes / 60), minutes: totalMinutes % 60 };
}

// healthy = 7-9h inclusive (drives the success color)
export function isHealthyDuration(hours: number): boolean {
  return hours >= 7 && hours <= 9;
}

export function sleepQualityMessage(hours: number): string {
  if (hours < 6) return 'Add more sleep';
  if (hours < 7) return 'Almost ideal';
  if (hours <= 9) return 'Perfect amount!';
  return 'Extra rest time';
}
