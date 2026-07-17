import { Platform } from 'react-native';

import type { SleepSession, SleepSettings } from '@/domain/models';

import {
  createEndedLiveActivityProps,
  createSleepLiveActivityProps,
  liveActivityWakeTarget,
  type TwilightLiveActivityProps,
} from './live-activity-state';

export type LiveActivityInstanceLike = {
  update: (props: TwilightLiveActivityProps) => Promise<void> | void;
  end: (
    dismissalPolicy: 'default' | 'immediate' | string,
    props: TwilightLiveActivityProps,
    contentDate?: Date,
  ) => Promise<void> | void;
};

export type LiveActivityFactoryLike = {
  getInstances: () => LiveActivityInstanceLike[];
  start: (props: TwilightLiveActivityProps, url?: string) => LiveActivityInstanceLike;
};

export type SyncSleepLiveActivityOptions = {
  factory?: LiveActivityFactoryLike;
  now?: Date;
  platform?: string;
};

export type SyncSleepLiveActivityResult =
  | { liveActivityId: string; status: 'started' | 'updated' }
  | { liveActivityId: null; status: 'ended' }
  | { liveActivityId: null; reason: 'disabled' | 'unsupported-platform'; status: 'skipped' };

export async function syncSleepLiveActivity(
  activeSession: SleepSession | null,
  settings: SleepSettings,
  {
    factory,
    now = new Date(),
    platform = Platform.OS,
  }: SyncSleepLiveActivityOptions = {},
): Promise<SyncSleepLiveActivityResult> {
  if (platform !== 'ios') {
    return { liveActivityId: null, reason: 'unsupported-platform', status: 'skipped' };
  }

  const liveActivityFactory = factory ?? await getDefaultLiveActivityFactory();

  if (!activeSession || !settings.liveActivityEnabled) {
    await endLiveActivityInstances(liveActivityFactory.getInstances(), now);

    if (!activeSession && liveActivityFactory.getInstances().length > 0) {
      return { liveActivityId: null, status: 'ended' };
    }

    return settings.liveActivityEnabled
      ? { liveActivityId: null, status: 'ended' }
      : { liveActivityId: null, reason: 'disabled', status: 'skipped' };
  }

  const props = createSleepLiveActivityProps(activeSession, settings, now);
  const existing = liveActivityFactory.getInstances()[0] ?? null;

  if (existing) {
    await existing.update(props);
    return { liveActivityId: activeSession.id, status: 'updated' };
  }

  liveActivityFactory.start(props, `twilight://sleep-session/${activeSession.id}`);
  return { liveActivityId: activeSession.id, status: 'started' };
}

export async function endSleepLiveActivities(
  factory?: LiveActivityFactoryLike,
  now = new Date(),
) {
  const liveActivityFactory = factory ?? await getDefaultLiveActivityFactory();
  await endLiveActivityInstances(liveActivityFactory.getInstances(), now);
}

export async function addSleepLiveActivityWakeListener(onWake: () => void | Promise<void>) {
  if (Platform.OS !== 'ios') {
    return { remove: () => undefined };
  }

  const { addUserInteractionListener } = await import('expo-widgets');

  return addUserInteractionListener((event) => {
    if (event.target === liveActivityWakeTarget) {
      void onWake();
    }
  });
}

async function endLiveActivityInstances(instances: LiveActivityInstanceLike[], now: Date) {
  const endedProps = createEndedLiveActivityProps(now);

  await Promise.all(
    instances.map((instance) =>
      instance.end('immediate', endedProps, now)
    ),
  );
}

async function getDefaultLiveActivityFactory(): Promise<LiveActivityFactoryLike> {
  const liveActivity = await import('../../widgets/TwilightLiveActivity');
  return liveActivity.default as unknown as LiveActivityFactoryLike;
}
