export const liveActivitySpikeName = 'TwilightLiveActivitySpike';
export const liveActivityWakeTarget = 'wake-up';

export type TwilightLiveActivitySpikeProps = {
  title: string;
  phase: 'sleeping' | 'windDown' | 'ended';
  elapsedMinutes: number;
  remainingMinutes: number;
  progress: number;
};

export function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function createLiveActivitySpikeProps(
  now: Date,
  startedAt: Date,
  goalMinutes: number,
): TwilightLiveActivitySpikeProps {
  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 60000));
  const remainingMinutes = Math.max(0, goalMinutes - elapsedMinutes);
  const progress = clampProgress(goalMinutes <= 0 ? 0 : elapsedMinutes / goalMinutes);

  return {
    title: 'Rejuvenating...',
    phase: remainingMinutes > 0 ? 'sleeping' : 'ended',
    elapsedMinutes,
    remainingMinutes,
    progress,
  };
}

export function createWindDownSpikeProps(minutesUntilBed: number): TwilightLiveActivitySpikeProps {
  return {
    title: 'Wind-down soon',
    phase: 'windDown',
    elapsedMinutes: 0,
    remainingMinutes: Math.max(0, minutesUntilBed),
    progress: 0,
  };
}
