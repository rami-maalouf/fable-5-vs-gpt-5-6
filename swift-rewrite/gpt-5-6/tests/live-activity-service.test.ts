import type { SleepSession } from '@/domain/models';

jest.mock('../widgets/SleepLiveActivity', () => ({
  SleepLiveActivity: {
    getInstances: jest.fn(() => []),
    start: jest.fn(),
  },
}));

import {
  createSleepActivityProps,
  createSleepLiveActivityService,
  type SleepLiveActivityInstance,
} from '@/services/live-activity';

function session(overrides: Partial<SleepSession> = {}): SleepSession {
  return {
    id: 'session-1',
    tag: 'Sleep',
    startTime: 1_000,
    endTime: null,
    startTimeZone: 'America/Edmonton',
    endTimeZone: null,
    createdAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
  };
}

function activity(id: string) {
  return {
    nativeLiveActivity: { activityId: id },
    update: jest.fn(async () => undefined),
    end: jest.fn(async () => undefined),
  } as unknown as SleepLiveActivityInstance;
}

function harness({
  enabled = true,
  instances = [],
  persistedId = null,
  platform = 'ios',
}: {
  enabled?: boolean;
  instances?: SleepLiveActivityInstance[];
  persistedId?: string | null;
  platform?: string;
} = {}) {
  const started = activity('started-activity');
  const factory = {
    getInstances: jest.fn(() => instances),
    start: jest.fn(() => started),
  };
  const settings = {
    getAll: jest.fn(async () => ({
      isOnboarded: true,
      optimalSleepMinutes: 22 * 60,
      optimalWakeMinutes: 7 * 60,
      windDownReminderEnabled: true,
      themeMode: 'dark' as const,
      themePalette: 'twilight' as const,
      liveActivityEnabled: enabled,
      liveActivityId: persistedId,
    })),
    set: jest.fn(async () => undefined),
  };
  const service = createSleepLiveActivityService({ factory, platform, settings });
  return { factory, service, settings, started };
}

describe('sleep live activity service', () => {
  it('creates a nine-hour sleeping projection with the exact parity title', () => {
    expect(
      createSleepActivityProps(session(), {
        optimalSleepMinutes: 22 * 60,
        optimalWakeMinutes: 7 * 60,
      }),
    ).toEqual({
      goalEndAt: 32_401_000,
      phase: 'sleeping',
      sessionId: 'session-1',
      startedAt: 1_000,
      status: 'Sleep session active',
      title: 'Rejuvenating...',
    });
  });

  it('starts and persists an activity when an enabled session has no native instance', async () => {
    const { factory, service, settings } = harness();

    const result = await service.reconcile(session());

    expect(result).toEqual({ activityId: 'started-activity', status: 'started' });
    expect(factory.start).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-1', title: 'Rejuvenating...' }),
      'twilight://',
    );
    expect(settings.set).toHaveBeenCalledWith('liveActivityId', 'started-activity');
  });

  it('adopts the persisted instance on relaunch, updates it, and ends duplicates', async () => {
    const persisted = activity('persisted-activity');
    const duplicate = activity('duplicate-activity');
    const { factory, service, settings } = harness({
      instances: [duplicate, persisted],
      persistedId: 'persisted-activity',
    });

    const result = await service.reconcile(session());

    expect(result).toEqual({ activityId: 'persisted-activity', status: 'updated' });
    expect(persisted.update).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-1' }),
    );
    expect(duplicate.end).toHaveBeenCalledWith(
      'immediate',
      expect.objectContaining({ phase: 'ended' }),
      expect.any(Date),
    );
    expect(factory.start).not.toHaveBeenCalled();
    expect(settings.set).toHaveBeenCalledWith('liveActivityId', 'persisted-activity');
  });

  it('ends native activities and clears persistence after wake-up', async () => {
    const existing = activity('existing-activity');
    const { service, settings } = harness({
      instances: [existing],
      persistedId: 'existing-activity',
    });

    const result = await service.reconcile(null);

    expect(result).toEqual({ activityId: null, status: 'ended' });
    expect(existing.end).toHaveBeenCalledWith(
      'immediate',
      expect.objectContaining({ phase: 'ended' }),
      expect.any(Date),
    );
    expect(settings.set).toHaveBeenCalledWith('liveActivityId', null);
  });

  it('respects the disabled setting without starting a duplicate', async () => {
    const existing = activity('existing-activity');
    const { factory, service } = harness({ enabled: false, instances: [existing] });

    const result = await service.reconcile(session());

    expect(result.status).toBe('ended');
    expect(existing.end).toHaveBeenCalled();
    expect(factory.start).not.toHaveBeenCalled();
  });

  it('is an explicit no-op outside iOS and clears stale persistence', async () => {
    const existing = activity('ios-only-activity');
    const { factory, service, settings } = harness({
      instances: [existing],
      persistedId: 'ios-only-activity',
      platform: 'android',
    });

    const result = await service.reconcile(session());

    expect(result).toEqual({ activityId: null, status: 'unsupported' });
    expect(factory.getInstances).not.toHaveBeenCalled();
    expect(factory.start).not.toHaveBeenCalled();
    expect(existing.end).not.toHaveBeenCalled();
    expect(settings.set).toHaveBeenCalledWith('liveActivityId', null);
  });
});
