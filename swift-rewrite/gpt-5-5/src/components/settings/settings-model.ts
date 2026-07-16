import type { SleepSettings } from '@/domain/models';

const minutesPerDay = 24 * 60;

function normalizeMinutes(minutes: number) {
  return ((minutes % minutesPerDay) + minutesPerDay) % minutesPerDay;
}

export function formatSettingsClockTime(minutes: number) {
  const normalized = normalizeMinutes(minutes);
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

export function formatGoalDurationLabel(sleepMinutes: number, wakeMinutes: number) {
  const start = normalizeMinutes(sleepMinutes);
  const end = normalizeMinutes(wakeMinutes);
  const duration = end > start ? end - start : minutesPerDay - start + end;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (minutes === 0) {
    return `Goal: ${hours} hr`;
  }

  return `Goal: ${hours} hr ${minutes} min`;
}

export function updateSleepGoal(
  settings: SleepSettings,
  {
    sleepMinutes,
    wakeMinutes,
  }: {
    sleepMinutes: number;
    wakeMinutes: number;
  },
): SleepSettings {
  return {
    ...settings,
    optimalSleepMinutes: normalizeMinutes(sleepMinutes),
    optimalWakeMinutes: normalizeMinutes(wakeMinutes),
  };
}
