import type { SleepSettings } from '@/domain/models';
import { defaultSleepSettings } from '@/domain/models';
import type { SleepNightRecord } from '@/domain/metrics/core';

import {
  buildAlignmentCardModel,
  buildMovingAverageCardModel,
  formatSignedHours,
} from './dashboard-card-models';

const settings: SleepSettings = {
  ...defaultSleepSettings,
  optimalSleepMinutes: 22 * 60,
  optimalWakeMinutes: 7 * 60,
};

function record(index: number, durationHours: number): SleepNightRecord {
  const date = new Date(Date.UTC(2026, 6, index + 1, 12));
  const dateKey = date.toISOString().slice(0, 10);
  const bedtimeOffsetHours = 4 + (index % 3) * 0.2;

  return {
    bedtimeOffsetHours,
    date,
    dateKey,
    durationHours,
    midpointOffsetHours: bedtimeOffsetHours + durationHours / 2,
    sessionId: dateKey,
    wakeOffsetHours: bedtimeOffsetHours + durationHours,
    weekday: date.getUTCDay() + 1,
  };
}

describe('dashboard chart card models', () => {
  it('builds moving average points from the shared metric engine', () => {
    const records = Array.from({ length: 14 }, (_, index) => record(index, index < 7 ? 8 : 9));
    const model = buildMovingAverageCardModel(records, settings);

    expect(model.points).toHaveLength(8);
    expect(model.targetHours).toBe(9);
    expect(model.latest?.movingAverageHours).toBe(9);
    expect(model.latest?.vsTargetHours).toBe(0);
    expect(model.latest?.vsPriorHours).toBe(1);
    expect(model.domain[1] - model.domain[0]).toBeGreaterThanOrEqual(0.9);
  });

  it('builds alignment points and latest components from the shared metric engine', () => {
    const records = Array.from({ length: 10 }, (_, index) => record(index, 8 + (index % 2) * 0.5));
    const model = buildAlignmentCardModel(records, settings);

    expect(model.points).toHaveLength(10);
    expect(model.latest?.dailyScore).toBeGreaterThan(0);
    expect(model.latest?.durationScore).toBeGreaterThan(0);
    expect(model.bestSevenDayScore).toBeGreaterThan(0);
  });

  it('formats signed hour deltas compactly', () => {
    expect(formatSignedHours(1.2)).toBe('+1.2h');
    expect(formatSignedHours(-0.4)).toBe('-0.4h');
    expect(formatSignedHours(null)).toBe('--');
  });
});
