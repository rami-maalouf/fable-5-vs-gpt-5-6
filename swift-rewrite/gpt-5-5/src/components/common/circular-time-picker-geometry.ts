export const minutesPerDay = 24 * 60;
export const degreesPerDay = 360;
export const circularTimePickerGrabThresholdDegrees = 35;
export const circularTimePickerSnapDegrees = 1.25;

export type TimePickerKnob = 'sleep' | 'wake';

export function normalizeAngle(angle: number) {
  return ((angle % degreesPerDay) + degreesPerDay) % degreesPerDay;
}

export function minutesToAngle(minutes: number) {
  return normalizeAngle((minutes / minutesPerDay) * degreesPerDay);
}

export function angleToMinutes(angle: number) {
  return Math.round((normalizeAngle(angle) / degreesPerDay) * minutesPerDay) % minutesPerDay;
}

export function pointToPickerAngle({
  centerX,
  centerY,
  x,
  y,
}: {
  centerX: number;
  centerY: number;
  x: number;
  y: number;
}) {
  return normalizeAngle((Math.atan2(y - centerY, x - centerX) * 180) / Math.PI + 90);
}

export function angleDifference(angle1: number, angle2: number) {
  let difference = normalizeAngle(angle1) - normalizeAngle(angle2);

  if (difference > 180) {
    difference -= degreesPerDay;
  }

  if (difference < -180) {
    difference += degreesPerDay;
  }

  return difference;
}

export function snapAngle(angle: number, snapDegrees = circularTimePickerSnapDegrees) {
  return normalizeAngle(Math.round(normalizeAngle(angle) / snapDegrees) * snapDegrees);
}

export function durationMinutesBetweenAngles(sleepAngle: number, wakeAngle: number) {
  let difference = normalizeAngle(wakeAngle) - normalizeAngle(sleepAngle);

  if (difference < 0) {
    difference += degreesPerDay;
  }

  return Math.round((difference / degreesPerDay) * minutesPerDay);
}

export function formatSleepDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

export function getSleepQualityMessage(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);

  if (hours < 6) {
    return 'Add more sleep';
  }

  if (hours < 7) {
    return 'Almost ideal';
  }

  if (hours <= 9) {
    return 'Perfect amount!';
  }

  return 'Extra rest time';
}

export function isHealthySleepDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);

  return hours >= 7 && hours <= 9;
}

export function nearestKnobForAngle({
  angle,
  sleepAngle,
  threshold = circularTimePickerGrabThresholdDegrees,
  wakeAngle,
}: {
  angle: number;
  sleepAngle: number;
  wakeAngle: number;
  threshold?: number;
}): TimePickerKnob | null {
  const sleepDistance = Math.abs(angleDifference(angle, sleepAngle));
  const wakeDistance = Math.abs(angleDifference(angle, wakeAngle));

  if (sleepDistance < threshold && sleepDistance < wakeDistance) {
    return 'sleep';
  }

  if (wakeDistance < threshold) {
    return 'wake';
  }

  return null;
}

export function polarPointForAngle({ angle, center, radius }: { angle: number; center: number; radius: number }) {
  const radians = ((normalizeAngle(angle) - 90) * Math.PI) / 180;

  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius,
  };
}
