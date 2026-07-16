import { isWakeInteraction } from '../spikes/live-activity/interaction';

describe('live activity interaction contract', () => {
  it('accepts only the sleep activity wake target', () => {
    expect(
      isWakeInteraction({
        source: 'SleepSessionActivity',
        target: 'wake-up',
        timestamp: 1,
        type: 'ExpoWidgetsUserInteraction',
      }),
    ).toBe(true);
    expect(
      isWakeInteraction({
        source: 'OtherActivity',
        target: 'wake-up',
        timestamp: 1,
        type: 'ExpoWidgetsUserInteraction',
      }),
    ).toBe(false);
    expect(
      isWakeInteraction({
        source: 'SleepSessionActivity',
        target: 'open',
        timestamp: 1,
        type: 'ExpoWidgetsUserInteraction',
      }),
    ).toBe(false);
  });
});
