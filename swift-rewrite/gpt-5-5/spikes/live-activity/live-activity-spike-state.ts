import { defaultSleepSettings, type SleepSession } from '@/domain/models';
import {
  clampProgress,
  createSleepLiveActivityProps,
  createWindDownLiveActivityProps,
  liveActivityWakeTarget,
  twilightLiveActivityName,
  type TwilightLiveActivityProps,
} from '@/services/live-activity-state';

export { clampProgress, liveActivityWakeTarget };

export const liveActivitySpikeName = twilightLiveActivityName;

export type TwilightLiveActivitySpikeProps = TwilightLiveActivityProps;

export function createLiveActivitySpikeProps(
  now: Date,
  startedAt: Date,
  goalMinutes: number,
): TwilightLiveActivitySpikeProps {
  const session: SleepSession = {
    createdAt: startedAt,
    endTime: null,
    endTimeZone: null,
    id: 'live-activity-spike',
    startTime: startedAt,
    startTimeZone: 'UTC',
    updatedAt: startedAt,
  };

  return createSleepLiveActivityProps(
    session,
    {
      ...defaultSleepSettings,
      optimalSleepMinutes: 0,
      optimalWakeMinutes: goalMinutes,
    },
    now,
  );
}

export function createWindDownSpikeProps(minutesUntilBed: number): TwilightLiveActivitySpikeProps {
  return createWindDownLiveActivityProps(minutesUntilBed);
}
