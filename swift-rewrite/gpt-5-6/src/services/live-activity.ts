import { Platform } from 'react-native';

import { settingsStore } from '@/data/settings-store';
import type { SleepSession, SleepSettings } from '@/domain/models';
import { goalDurationHours } from '@/domain/metrics/core';
import type { SleepActivityProps } from '../../widgets/SleepLiveActivity';

export interface SleepLiveActivityInstance {
  activityId?: string;
  end(
    dismissalPolicy?: 'default' | 'immediate',
    props?: SleepActivityProps,
    contentDate?: Date,
  ): Promise<void>;
  update(props: SleepActivityProps): Promise<void>;
}

interface SleepLiveActivityFactory {
  getInstances(): SleepLiveActivityInstance[];
  start(props: SleepActivityProps, url?: string): SleepLiveActivityInstance;
}

interface SleepLiveActivitySettings {
  getAll(): Promise<SleepSettings>;
  set(key: 'liveActivityId', value: string | null): Promise<void>;
}

interface SleepLiveActivityDependencies {
  factory?: SleepLiveActivityFactory;
  now?: () => number;
  platform?: string;
  settings?: SleepLiveActivitySettings;
}

export type SleepLiveActivityReconcileResult = {
  activityId: string | null;
  status: 'ended' | 'started' | 'unsupported' | 'updated';
};

const deepLink = 'twilight://';
const millisecondsPerHour = 60 * 60 * 1_000;
const windDownLeadMilliseconds = 3 * millisecondsPerHour;

export function createSleepActivityProps(
  session: SleepSession,
  settings: Pick<SleepSettings, 'optimalSleepMinutes' | 'optimalWakeMinutes'>,
): SleepActivityProps {
  const goalDuration = goalDurationHours(
    settings.optimalSleepMinutes,
    settings.optimalWakeMinutes,
  );
  return {
    goalEndAt: session.startTime + goalDuration * millisecondsPerHour,
    phase: 'sleeping',
    sessionId: session.id,
    startedAt: session.startTime,
    status: 'Sleep session active',
    title: 'Rejuvenating...',
  };
}

export function createWindDownActivityProps(
  settings: Pick<SleepSettings, 'optimalSleepMinutes'>,
  now: number,
): SleepActivityProps | null {
  const bedtime = new Date(now);
  bedtime.setHours(
    Math.floor(settings.optimalSleepMinutes / 60),
    settings.optimalSleepMinutes % 60,
    0,
    0,
  );
  if (bedtime.getTime() <= now) {
    bedtime.setDate(bedtime.getDate() + 1);
  }

  const goalEndAt = bedtime.getTime();
  const startedAt = goalEndAt - windDownLeadMilliseconds;
  if (now < startedAt) {
    return null;
  }

  return {
    goalEndAt,
    phase: 'windDown',
    sessionId: 'wind-down',
    startedAt,
    status: 'Bedtime is approaching',
    title: 'Wind Down Time',
  };
}

function endedProps(session: SleepSession | null, now: number): SleepActivityProps {
  const startedAt = session?.startTime ?? now;
  return {
    goalEndAt: Math.max(startedAt + 1, session?.endTime ?? now),
    phase: 'ended',
    sessionId: session?.id ?? '',
    startedAt,
    status: 'Sleep session complete',
    title: 'Good morning',
  };
}

export function getSleepLiveActivityId(instance: SleepLiveActivityInstance): string | null {
  const nativeActivity = instance as SleepLiveActivityInstance & {
    nativeLiveActivity?: { activityId?: string };
  };
  const activityId = instance.activityId ?? nativeActivity.nativeLiveActivity?.activityId;
  return typeof activityId === 'string' && activityId.length > 0 ? activityId : null;
}

export function createSleepLiveActivityService({
  factory,
  now = Date.now,
  platform = Platform.OS,
  settings = settingsStore,
}: SleepLiveActivityDependencies = {}) {
  const persistId = (activityId: string | null) => settings.set('liveActivityId', activityId);

  async function endInstances(
    instances: readonly SleepLiveActivityInstance[],
    session: SleepSession | null,
  ): Promise<void> {
    const endedAt = now();
    const finalProps = endedProps(session, endedAt);
    const outcomes = await Promise.allSettled(
      instances.map((instance) => instance.end('immediate', finalProps, new Date(endedAt))),
    );
    const failure = outcomes.find((outcome) => outcome.status === 'rejected');
    if (failure?.status === 'rejected') {
      throw failure.reason;
    }
  }

  async function reconcile(
    activeSession: SleepSession | null,
  ): Promise<SleepLiveActivityReconcileResult> {
    const currentSettings = await settings.getAll();
    if (platform !== 'ios') {
      await persistId(null);
      return { activityId: null, status: 'unsupported' };
    }

    const liveActivityFactory = factory ?? await getDefaultFactory();
    const instances = liveActivityFactory.getInstances();
    const props = activeSession
      ? createSleepActivityProps(activeSession, currentSettings)
      : createWindDownActivityProps(currentSettings, now());
    if (!currentSettings.liveActivityEnabled || !props) {
      try {
        await endInstances(instances, activeSession);
      } finally {
        await persistId(null);
      }
      return { activityId: null, status: 'ended' };
    }

    if (instances.length === 0) {
      const started = liveActivityFactory.start(props, deepLink);
      const activityId = getSleepLiveActivityId(started);
      await persistId(activityId);
      return { activityId, status: 'started' };
    }

    const persisted = currentSettings.liveActivityId;
    const primary =
      instances.find((instance) => getSleepLiveActivityId(instance) === persisted) ?? instances[0];
    const duplicates = instances.filter((instance) => instance !== primary);
    await Promise.all([primary.update(props), endInstances(duplicates, activeSession)]);
    const activityId = getSleepLiveActivityId(primary);
    await persistId(activityId);
    return { activityId, status: 'updated' };
  }

  return { reconcile };
}

export const sleepLiveActivityService = createSleepLiveActivityService();

async function getDefaultFactory(): Promise<SleepLiveActivityFactory> {
  const widgetModule = await import('../../widgets/SleepLiveActivity');
  return widgetModule.SleepLiveActivity;
}
