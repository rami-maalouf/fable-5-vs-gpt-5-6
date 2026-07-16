import {
  createWeekChartModel,
  deviationBand,
  shouldHideClockTick,
} from '../src/components/charts/week-chart-model';
import type { SleepNightRecord } from '../src/domain/metrics/core';

function record(
  dayKey: string,
  durationHours: number,
  bedtimeOffset: number,
  wakeOffset: number,
): SleepNightRecord {
  return {
    bedtimeOffset,
    date: new Date(`${dayKey}T12:00:00`).getTime(),
    dayKey,
    durationHours,
    id: dayKey,
    midpointOffset: bedtimeOffset + durationHours / 2,
    wakeOffset,
    weekday: new Date(`${dayKey}T12:00:00Z`).getUTCDay() + 1,
  };
}

describe('week chart model', () => {
  it('maps the latest seven records into the shared duration and clock domain', () => {
    const records = Array.from({ length: 9 }, (_, index) => (
      record(`2026-07-${String(index + 1).padStart(2, '0')}`, 7 + index / 10, 7.5, 14.5)
    ));

    const model = createWeekChartModel(records, 7.5, 14.5);

    expect(model.data).toHaveLength(7);
    expect(model.data[0]).toMatchObject({
      bedtimeChartHour: 10.5,
      day: 'Fri',
      durationLabel: '7.2h',
      index: 0,
      wakeChartHour: 3.5,
    });
    expect(model.data[6]).toMatchObject({ day: 'Thu', durationLabel: '7.8h', index: 6 });
    expect(model.rules.duration.chartHour).toBeCloseTo(7.5);
    expect(model.rules.sleep.chartHour).toBe(10.5);
    expect(model.rules.wake.chartHour).toBe(3.5);
  });

  it('uses the reference duration-deviation thresholds', () => {
    expect(deviationBand(7.25, 7)).toBe('success');
    expect(deviationBand(7 + 15 / 60, 7)).toBe('success');
    expect(deviationBand(7 + 16 / 60, 7)).toBe('warning');
    expect(deviationBand(7 + 31 / 60, 7)).toBe('warning');
    expect(deviationBand(7 + 32 / 60, 7)).toBe('accent');
  });

  it('hides a regular clock tick within 31 minutes of an annotated rule', () => {
    expect(shouldHideClockTick(8, [8 + 31 / 60])).toBe(true);
    expect(shouldHideClockTick(8, [8 - 31 / 60])).toBe(true);
    expect(shouldHideClockTick(8, [8 + 32 / 60])).toBe(false);
  });

  it('returns an empty model without manufacturing chart values', () => {
    expect(createWeekChartModel([], 4, 13)).toMatchObject({ data: [] });
  });
});
