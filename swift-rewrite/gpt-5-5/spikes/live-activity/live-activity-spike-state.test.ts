import {
  clampProgress,
  createLiveActivitySpikeProps,
  createWindDownSpikeProps,
} from './live-activity-spike-state';

describe('live activity spike state', () => {
  it('builds sleep progress props from elapsed time', () => {
    const startedAt = new Date('2026-07-16T06:00:00.000Z');
    const now = new Date('2026-07-16T08:30:00.000Z');

    expect(createLiveActivitySpikeProps(now, startedAt, 480)).toEqual({
      elapsedMinutes: 150,
      goalMinutes: 480,
      phase: 'sleeping',
      remainingMinutes: 330,
      progress: 0.3125,
      sessionId: 'live-activity-spike',
      startedAtIso: '2026-07-16T06:00:00.000Z',
      title: 'Rejuvenating...',
    });
  });

  it('clamps progress and ends once the goal is reached', () => {
    const startedAt = new Date('2026-07-16T06:00:00.000Z');
    const now = new Date('2026-07-16T16:00:00.000Z');

    expect(clampProgress(-0.2)).toBe(0);
    expect(clampProgress(1.2)).toBe(1);
    expect(createLiveActivitySpikeProps(now, startedAt, 480)).toMatchObject({
      phase: 'ended',
      remainingMinutes: 0,
      progress: 1,
    });
  });

  it('builds wind-down props for the planned fallback state', () => {
    expect(createWindDownSpikeProps(37)).toEqual({
      elapsedMinutes: 0,
      goalMinutes: 0,
      phase: 'windDown',
      remainingMinutes: 37,
      progress: 0,
      sessionId: null,
      startedAtIso: null,
      title: 'Wind-down soon',
    });
  });
});
