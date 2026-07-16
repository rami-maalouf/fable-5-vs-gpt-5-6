import type { SleepSettings } from '@/domain/models';
import type { SleepNightRecord } from '@/domain/metrics/core';

import {
  buildDurationMomentumModel,
  buildRollingComponentsModel,
  buildRollingConsistencyModel,
} from './metrics-chart-models';

const settings: SleepSettings = {
  isOnboarded: true,
  liveActivityEnabled: true,
  liveActivityId: null,
  optimalSleepMinutes: 22 * 60,
  optimalWakeMinutes: 7 * 60,
  themeMode: 'dark',
  themePalette: 'twilight',
  windDownEnabled: true,
};

function record(index: number, durationHours = 9): SleepNightRecord {
  const day = String(index + 1).padStart(2, '0');

  return {
    bedtimeOffsetHours: 4,
    date: new Date(`2026-07-${day}T12:00:00.000Z`),
    dateKey: `2026-07-${day}`,
    durationHours,
    midpointOffsetHours: 8.5,
    sessionId: `session-${index}`,
    wakeOffsetHours: 13,
    weekday: (index % 7) + 1,
  };
}

describe('metrics chart models', () => {
  it('builds duration momentum bars and seven-night averages', () => {
    const model = buildDurationMomentumModel(Array.from({ length: 8 }, (_, index) => record(index, 8 + index / 10)), settings);

    expect(model.points).toHaveLength(8);
    expect(model.points[0]).toMatchObject({ durationHours: 8, movingAverageHours: null, targetHours: 9 });
    expect(model.points[6].movingAverageHours).toBeCloseTo(8.3);
    expect(model.latest?.dateKey).toBe('2026-07-08');
  });

  it('builds a rolling consistency model after fourteen nights', () => {
    const model = buildRollingConsistencyModel(Array.from({ length: 14 }, (_, index) => record(index)), settings);

    expect(model.points).toHaveLength(14);
    expect(model.points[12].score).toBeNull();
    expect(model.points[13]).toMatchObject({ score: 100, sleepConsistency: 100, wakeConsistency: 100, scheduleAccuracy: 100 });
  });

  it('builds filtered rolling component models', () => {
    const records = Array.from({ length: 14 }, (_, index) => record(index));

    expect(buildRollingComponentsModel(records, settings, 'all').series).toEqual(['sleepConsistency', 'wakeConsistency', 'scheduleAccuracy']);
    expect(buildRollingComponentsModel(records, settings, 'bedtime').series).toEqual(['sleepConsistency']);
    expect(buildRollingComponentsModel(records, settings, 'wake').series).toEqual(['wakeConsistency']);
    expect(buildRollingComponentsModel(records, settings, 'accuracy').series).toEqual(['scheduleAccuracy']);
  });
});
