import { defaultSleepSettings, type SleepSession } from '@/domain/models';

import {
  syncWindDownLiveActivity,
  syncSleepLiveActivity,
  type LiveActivityFactoryLike,
  type LiveActivityInstanceLike,
} from './live-activity';

const activeSession: SleepSession = {
  id: 'sleep-1',
  createdAt: new Date('2026-07-17T05:00:00.000Z'),
  endTime: null,
  endTimeZone: null,
  startTime: new Date('2026-07-17T05:00:00.000Z'),
  startTimeZone: 'America/Edmonton',
  updatedAt: new Date('2026-07-17T05:00:00.000Z'),
};

function createFactory() {
  const instances: LiveActivityInstanceLike[] = [];
  const updates: unknown[] = [];
  const ended: unknown[] = [];

  const factory: LiveActivityFactoryLike = {
    getInstances() {
      return instances;
    },
    start(props) {
      const instance = {
        async end(_policy: string, props: unknown) {
          ended.push(props);
        },
        async update(props: unknown) {
          updates.push(props);
        },
      };
      instances.push(instance);
      updates.push(props);
      return instance;
    },
  };

  return { ended, factory, instances, updates };
}

describe('live activity service', () => {
  it('starts a live activity for an active session on ios', async () => {
    const { factory, instances, updates } = createFactory();

    const result = await syncSleepLiveActivity(activeSession, defaultSleepSettings, {
      factory,
      now: new Date('2026-07-17T07:00:00.000Z'),
      platform: 'ios',
    });

    expect(result).toEqual({ liveActivityId: 'sleep-1', status: 'started' });
    expect(instances).toHaveLength(1);
    expect(updates[0]).toMatchObject({ sessionId: 'sleep-1', title: 'Rejuvenating...' });
  });

  it('updates an existing live activity instead of starting a duplicate', async () => {
    const { factory, instances, updates } = createFactory();

    await syncSleepLiveActivity(activeSession, defaultSleepSettings, {
      factory,
      now: new Date('2026-07-17T07:00:00.000Z'),
      platform: 'ios',
    });
    const result = await syncSleepLiveActivity(activeSession, defaultSleepSettings, {
      factory,
      now: new Date('2026-07-17T08:00:00.000Z'),
      platform: 'ios',
    });

    expect(result).toEqual({ liveActivityId: 'sleep-1', status: 'updated' });
    expect(instances).toHaveLength(1);
    expect(updates[1]).toMatchObject({ elapsedMinutes: 180, sessionId: 'sleep-1' });
  });

  it('ends activities when there is no active session', async () => {
    const { ended, factory } = createFactory();

    await syncSleepLiveActivity(activeSession, defaultSleepSettings, {
      factory,
      now: new Date('2026-07-17T07:00:00.000Z'),
      platform: 'ios',
    });
    const result = await syncSleepLiveActivity(null, defaultSleepSettings, {
      factory,
      now: new Date('2026-07-17T08:00:00.000Z'),
      platform: 'ios',
    });

    expect(result).toEqual({ liveActivityId: null, status: 'ended' });
    expect(ended[0]).toMatchObject({ phase: 'ended', progress: 1 });
  });

  it('does not start when live activities are disabled or unsupported', async () => {
    const { factory, instances } = createFactory();

    await expect(
      syncSleepLiveActivity(activeSession, { ...defaultSleepSettings, liveActivityEnabled: false }, {
        factory,
        platform: 'ios',
      }),
    ).resolves.toEqual({ liveActivityId: null, reason: 'disabled', status: 'skipped' });

    await expect(
      syncSleepLiveActivity(activeSession, defaultSleepSettings, {
        factory,
        platform: 'android',
      }),
    ).resolves.toEqual({ liveActivityId: null, reason: 'unsupported-platform', status: 'skipped' });

    expect(instances).toHaveLength(0);
  });

  it('ends an existing live activity when the setting is disabled', async () => {
    const { ended, factory } = createFactory();

    await syncSleepLiveActivity(activeSession, defaultSleepSettings, {
      factory,
      now: new Date('2026-07-17T07:00:00.000Z'),
      platform: 'ios',
    });
    const result = await syncSleepLiveActivity(activeSession, {
      ...defaultSleepSettings,
      liveActivityEnabled: false,
    }, {
      factory,
      now: new Date('2026-07-17T08:00:00.000Z'),
      platform: 'ios',
    });

    expect(result).toEqual({ liveActivityId: null, reason: 'disabled', status: 'skipped' });
    expect(ended[0]).toMatchObject({ phase: 'ended', progress: 1 });
  });

  it('starts a wind-down live activity during the pre-bed window', async () => {
    const { factory, instances, updates } = createFactory();

    const result = await syncWindDownLiveActivity(defaultSleepSettings, {
      factory,
      now: new Date(2000, 0, 1, 19, 30),
      platform: 'ios',
    });

    expect(result).toEqual({ liveActivityId: 'wind-down', status: 'started' });
    expect(instances).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      phase: 'windDown',
      remainingMinutes: 150,
      title: 'Wind-down soon',
    });
  });

  it('ends wind-down live activities outside the pre-bed window', async () => {
    const { ended, factory } = createFactory();

    await syncWindDownLiveActivity(defaultSleepSettings, {
      factory,
      now: new Date(2000, 0, 1, 19, 30),
      platform: 'ios',
    });
    const result = await syncWindDownLiveActivity(defaultSleepSettings, {
      factory,
      now: new Date(2000, 0, 1, 15, 30),
      platform: 'ios',
    });

    expect(result).toEqual({ liveActivityId: null, status: 'ended' });
    expect(ended[0]).toMatchObject({ phase: 'ended', progress: 1 });
  });
});
