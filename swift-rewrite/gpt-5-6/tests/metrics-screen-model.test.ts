import type { SleepNightRecord } from '@/domain/metrics/core';
import {
  buildMetricsScreenModel,
  METRICS_RANGES,
  rangeDays,
} from '@/components/metrics/metrics-screen-model';

function record(dayKey: string, durationHours: number): SleepNightRecord {
  return {
    bedtimeOffset: 4,
    date: new Date(`${dayKey}T12:00:00`).getTime(),
    dayKey,
    durationHours,
    id: dayKey,
    midpointOffset: 4 + durationHours / 2,
    wakeOffset: 4 + durationHours,
    weekday: new Date(`${dayKey}T12:00:00Z`).getUTCDay() + 1,
  };
}

function sequentialRecords(count: number): SleepNightRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const dayKey = `2026-07-${String(index + 1).padStart(2, '0')}`;
    const item = record(dayKey, 6 + index * 0.1);
    const bedtimeOffset = 4 + (index % 4) * 0.25;
    return {
      ...item,
      bedtimeOffset,
      midpointOffset: bedtimeOffset + item.durationHours / 2,
      wakeOffset: bedtimeOffset + item.durationHours,
    };
  });
}

describe('metrics screen model', () => {
  it('maps every picker range to the engine window', () => {
    expect(METRICS_RANGES).toEqual(['30D', '90D', '1Y', 'All']);
    expect(METRICS_RANGES.map(rangeDays)).toEqual([30, 90, 365, null]);
  });

  it('builds overview and highlight values only from the metrics engine', () => {
    const model = buildMetricsScreenModel({
      allRecords: [
        record('2026-04-01', 6),
        record('2026-06-20', 7),
        record('2026-07-14', 8.5),
        record('2026-07-15', 9),
      ],
      range: '30D',
      referenceDayKey: '2026-07-16',
      targetDurationHours: 26 / 3,
    });

    expect(model.records.map((item) => item.dayKey)).toEqual([
      '2026-06-20',
      '2026-07-14',
      '2026-07-15',
    ]);
    expect(Object.fromEntries(model.overview.map((item) => [item.id, item.value]))).toEqual({
      averageDuration: '8h 10m',
      bestStreak: '2 days',
      currentStreak: '2 days',
      dataCoverage: '10%',
      goalHitRate: '67%',
      trackedNights: '3',
    });
    expect(Object.fromEntries(model.highlights.map((item) => [item.id, item.value]))).toEqual({
      debtCredit: '-1.5h',
      longestNight: '9h 0m',
      shortestNight: '7h 0m',
      totalSleep: '24h 30m',
    });
  });

  it('returns an explicit empty model for a range with no tracked nights', () => {
    const model = buildMetricsScreenModel({
      allRecords: [record('2025-01-01', 8)],
      range: '30D',
      referenceDayKey: '2026-07-16',
      targetDurationHours: 8,
    });

    expect(model.records).toEqual([]);
    expect(model.isEmpty).toBe(true);
  });

  it('restores the source trend, regularity, behavior, and range summaries', () => {
    const model = buildMetricsScreenModel({
      allRecords: sequentialRecords(16),
      range: '30D',
      referenceDayKey: '2026-07-16',
      targetDurationHours: 7,
      targetSleepOffset: 4,
      targetWakeOffset: 11,
    });

    expect(model.momentumSummary).toEqual({
      medianDuration: '6h 45m',
      recentTrend: '+11%',
    });
    expect(model.trends.map(({ average, change, days }) => ({ average, change, days }))).toEqual([
      { average: '7h 24m', change: '+4%', days: 3 },
      { average: '7h 12m', change: '+11%', days: 7 },
      { average: '6h 51m', change: '+13%', days: 14 },
      { average: '6h 45m', change: '-', days: 30 },
      { average: '6h 45m', change: '-', days: 90 },
    ]);
    expect(model.trends[0].sparkline).toEqual([7.3, 7.4, 7.5]);
    expect(model.regularity.stats.map((item) => item.id)).toEqual([
      'regularityScore',
      'bedtimeConsistency',
      'wakeConsistency',
      'scheduleAccuracy',
      'socialJetlag',
      'debtCredit',
    ]);
    expect(model.regularity.latest).toEqual({
      accuracy: '88%',
      bedtime: '89%',
      rollingScore: '86%',
      wake: '80%',
    });
    expect(model.behaviorSummary).toEqual({
      weekdayAverage: '6h 46m',
      weekendAverage: '6h 42m',
    });
    expect(model.footer).toEqual([
      { id: 'rangeStart', label: 'Range Start', value: 'Jul 1, 2026' },
      { id: 'totalDataRange', label: 'Total Data Range', value: '16 days' },
    ]);
  });

});
