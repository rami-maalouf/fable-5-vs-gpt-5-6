import type { SleepSession, SleepSettings } from '@/domain/models';

const minutesPerDay = 24 * 60;
const defaultWindDownWindowMinutes = 3 * 60;

export const twilightLiveActivityName = 'TwilightLiveActivity';
export const liveActivityWakeTarget = 'wake-up';

export type TwilightLiveActivityProps = {
  title: string;
  phase: 'sleeping' | 'windDown' | 'ended';
  elapsedMinutes: number;
  remainingMinutes: number;
  progress: number;
  goalMinutes: number;
  sessionId: string | null;
  startedAtIso: string | null;
};

export function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function getSleepGoalMinutes(settings: SleepSettings) {
  const sleepMinutes = normalizeMinutes(settings.optimalSleepMinutes);
  const wakeMinutes = normalizeMinutes(settings.optimalWakeMinutes);
  const duration = wakeMinutes > sleepMinutes
    ? wakeMinutes - sleepMinutes
    : minutesPerDay - sleepMinutes + wakeMinutes;

  return duration === 0 ? minutesPerDay : duration;
}

export function createSleepLiveActivityProps(
  session: SleepSession,
  settings: SleepSettings,
  now = new Date(),
): TwilightLiveActivityProps {
  const goalMinutes = getSleepGoalMinutes(settings);
  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - session.startTime.getTime()) / 60000));
  const remainingMinutes = Math.max(0, goalMinutes - elapsedMinutes);

  return {
    elapsedMinutes,
    goalMinutes,
    phase: remainingMinutes > 0 ? 'sleeping' : 'ended',
    progress: clampProgress(goalMinutes <= 0 ? 0 : elapsedMinutes / goalMinutes),
    remainingMinutes,
    sessionId: session.id,
    startedAtIso: session.startTime.toISOString(),
    title: 'Rejuvenating...',
  };
}

export function createEndedLiveActivityProps(now = new Date()): TwilightLiveActivityProps {
  return {
    elapsedMinutes: 0,
    goalMinutes: 0,
    phase: 'ended',
    progress: 1,
    remainingMinutes: 0,
    sessionId: null,
    startedAtIso: now.toISOString(),
    title: 'Awake',
  };
}

export function createWindDownLiveActivityProps(minutesUntilBed: number): TwilightLiveActivityProps {
  return {
    elapsedMinutes: 0,
    goalMinutes: 0,
    phase: 'windDown',
    progress: 0,
    remainingMinutes: Math.max(0, minutesUntilBed),
    sessionId: null,
    startedAtIso: null,
    title: 'Wind-down soon',
  };
}

export function getMinutesUntilBedtime(settings: SleepSettings, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return normalizeMinutes(settings.optimalSleepMinutes - currentMinutes);
}

export function shouldShowWindDownLiveActivity(
  settings: SleepSettings,
  now = new Date(),
  windowMinutes = defaultWindDownWindowMinutes,
) {
  const minutesUntilBed = getMinutesUntilBedtime(settings, now);
  return minutesUntilBed > 0 && minutesUntilBed <= windowMinutes;
}

function normalizeMinutes(minutes: number) {
  return ((minutes % minutesPerDay) + minutesPerDay) % minutesPerDay;
}
