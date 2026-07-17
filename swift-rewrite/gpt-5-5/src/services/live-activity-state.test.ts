import { defaultSleepSettings, type SleepSession } from '@/domain/models';

import {
  createSleepLiveActivityProps,
  createWindDownLiveActivityProps,
  twilightLiveActivityName,
} from './live-activity-state';

const activeSession: SleepSession = {
  id: 'sleep-1',
  createdAt: new Date('2026-07-17T05:00:00.000Z'),
  endTime: null,
  endTimeZone: null,
  startTime: new Date('2026-07-17T05:00:00.000Z'),
  startTimeZone: 'America/Edmonton',
  updatedAt: new Date('2026-07-17T05:00:00.000Z'),
};

describe('live activity state', () => {
  it('uses the production live activity name', () => {
    expect(twilightLiveActivityName).toBe('TwilightLiveActivity');
  });

  it('builds progress props from an active sleep session and settings goal', () => {
    const now = new Date('2026-07-17T07:15:00.000Z');

    expect(createSleepLiveActivityProps(activeSession, defaultSleepSettings, now)).toEqual({
      elapsedMinutes: 135,
      goalMinutes: 540,
      phase: 'sleeping',
      progress: 0.25,
      remainingMinutes: 405,
      sessionId: 'sleep-1',
      startedAtIso: '2026-07-17T05:00:00.000Z',
      title: 'Rejuvenating...',
    });
  });

  it('marks the activity ended once the sleep goal is reached', () => {
    const now = new Date('2026-07-17T15:00:00.000Z');

    expect(createSleepLiveActivityProps(activeSession, defaultSleepSettings, now)).toMatchObject({
      phase: 'ended',
      progress: 1,
      remainingMinutes: 0,
    });
  });

  it('builds wind-down fallback props without attaching a session', () => {
    expect(createWindDownLiveActivityProps(37)).toEqual({
      elapsedMinutes: 0,
      goalMinutes: 0,
      phase: 'windDown',
      progress: 0,
      remainingMinutes: 37,
      sessionId: null,
      startedAtIso: null,
      title: 'Wind-down soon',
    });
  });
});
