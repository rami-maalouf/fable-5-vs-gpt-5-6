// ports behavior of: Utils/SleepMetricsAnalyzer.swift (advanced metrics, task 15)
import type { SleepSession } from '../../models';
import { SleepMetricsAnalyzer } from '../analyzer';

const TZ = 'America/Denver';
const mstMs = (day: number, hour: number, minute = 0) => Date.UTC(2025, 0, day, hour + 7, minute);

let idCounter = 0;
function session(startDay: number, startHour: number, endDay: number, endHour: number, startMinute = 0, endMinute = 0): SleepSession {
  return {
    id: `s-${idCounter++}`,
    tag: 'Sleep Mode',
    startTime: mstMs(startDay, startHour, startMinute),
    endTime: mstMs(endDay, endHour, endMinute),
    startTimeZone: TZ,
    endTimeZone: TZ,
    createdAt: 0,
    updatedAt: 0,
  };
}

const TODAY = { year: 2025, month: 1, day: 20 };

function analyzer(sessions: SleepSession[], sleep: number | null = 22 * 60, wake: number | null = 7 * 60) {
  return new SleepMetricsAnalyzer(sessions, {
    optimalSleepMinutes: sleep,
    optimalWakeMinutes: wake,
    today: TODAY,
  });
}

describe('consistency scores (-40 pts per hour of std dev, truncated)', () => {
  test('identical bedtimes score 100', () => {
    const a = analyzer([session(14, 23, 15, 7), session(15, 23, 16, 7)]);
    expect(a.sleepConsistencyScore(a.records)).toBe(100);
  });

  test('bedtimes 22:00 and 00:00 (std dev 1h) score 60', () => {
    // offsets 4 and 6 -> mean 5, std dev 1 -> 100 - 40
    const a = analyzer([session(14, 22, 15, 6), session(15, 0, 16, 8)]);
    expect(a.sleepConsistencyScore(a.records)).toBe(60);
  });

  test('half-hour std dev truncates like Int() (100 - trunc(20) = 80)', () => {
    // offsets 4.5 and 5.5 -> std dev 0.5 -> deduction Int(20) = 20
    const a = analyzer([session(14, 22, 15, 6, 30, 30), session(15, 23, 16, 7, 30, 30)]);
    expect(a.sleepConsistencyScore(a.records)).toBe(80);
  });

  test('regularity is the mean of bedtime and wake consistency', () => {
    const a = analyzer([session(14, 22, 15, 6), session(15, 0, 16, 8)]);
    // bed 60, wake: offsets 12 and 14 -> std 1 -> 60 => (60+60)/2
    expect(a.regularityScore(a.records)).toBe(60);
  });
});

describe('schedule accuracy (-30 pts per hour of avg deviation, truncated)', () => {
  test('exactly on target scores 100', () => {
    const a = analyzer([session(14, 22, 15, 7)]);
    expect(a.scheduleAccuracyScore(a.records)).toBe(100);
  });

  test('one hour late on both ends scores 70', () => {
    const a = analyzer([session(14, 23, 15, 8)]);
    expect(a.scheduleAccuracyScore(a.records)).toBe(70);
  });

  test('zero without targets', () => {
    const a = analyzer([session(14, 23, 15, 8)], null, null);
    expect(a.scheduleAccuracyScore(a.records)).toBe(0);
  });
});

describe('social jetlag (weekend vs weekday midpoints)', () => {
  test('computes the wrapped midpoint delta', () => {
    // jan 15 2025 = wednesday (weekday), jan 19 = sunday (weekend)
    const weekdayNight = session(14, 23, 15, 7); // midpoint offset 9
    const weekendNight = session(19, 1, 19, 9); // bed 01:00 -> offset 7, 8h -> midpoint 11
    const a = analyzer([weekdayNight, weekendNight]);
    expect(a.socialJetlagHours(a.records)).toBeCloseTo(2, 10);
  });

  test('null when a group is empty', () => {
    const a = analyzer([session(14, 23, 15, 7)]);
    expect(a.socialJetlagHours(a.records)).toBeNull();
  });
});

describe('cumulative sleep debt vs the goal (9h)', () => {
  test('sums nightly deltas and builds a running series', () => {
    const a = analyzer([session(14, 23, 15, 7), session(15, 22, 16, 5)]); // 8h, 7h vs 9h goal
    expect(a.cumulativeDebtHours(a.records)).toBeCloseTo(-3, 10);
    const series = a.cumulativeDebtSeries(a.records);
    expect(series.map((p) => p.cumulativeHours)).toEqual([-1, -3]);
  });
});

describe('rolling 14-night consistency series', () => {
  test('null until the window fills, then windowed scores', () => {
    // 15 identical nights 23:00 -> 07:00
    const nights = Array.from({ length: 15 }, (_, i) => session(i + 1, 23, i + 2, 7));
    const a = analyzer(nights);
    const series = a.rollingConsistencySeries(a.records);
    expect(series[12].sleepConsistency).toBeNull();
    expect(series[13].sleepConsistency).toBe(100);
    // bed 1h late, wake on target -> avg deviation 0.5h -> 100 - trunc(15) = 85
    expect(series[14].scheduleAccuracy).toBe(85);
  });
});

describe('duration trends analysis (3/7/14/30/90)', () => {
  test('periods, averages and change vs the previous window', () => {
    // 6 nights: three 6h then three 8h
    const nights = [
      session(10, 0, 10, 6),
      session(11, 0, 11, 6),
      session(12, 0, 12, 6),
      session(13, 0, 13, 8),
      session(14, 0, 14, 8),
      session(15, 0, 15, 8),
    ];
    const a = analyzer(nights);
    const trends = a.durationTrendsAnalysis();
    expect(trends.map((t) => t.days)).toEqual([3, 7, 14, 30, 90]);
    const t3 = trends[0];
    expect(t3.averageDuration).toBeCloseTo(8, 10);
    expect(t3.previousAverageDuration).toBeCloseTo(6, 10);
    expect(t3.changePercent).toBeCloseTo(33.333333, 4);
    expect(t3.sparkline).toEqual([8, 8, 8]);
    // 7-day period has no previous window
    expect(trends[1].previousAverageDuration).toBeNull();
    expect(trends[1].changePercent).toBeNull();
  });
});

describe('weekday averages and histogram buckets', () => {
  test('weekday averages fill all 7 days with short names', () => {
    // wake jan 19 = sunday, jan 20 = monday
    const a = analyzer([session(18, 23, 19, 7), session(19, 23, 20, 6)]);
    const averages = a.weekdayAverages(a.records);
    expect(averages).toHaveLength(7);
    expect(averages[0]).toEqual({ weekday: 1, dayName: 'Sun', averageHours: 8, nights: 1 });
    expect(averages[1]).toEqual({ weekday: 2, dayName: 'Mon', averageHours: 7, nights: 1 });
    expect(averages[2].nights).toBe(0);
  });

  test('duration buckets split on the swift boundaries', () => {
    const a = analyzer([
      session(10, 0, 10, 4, 0, 30), // 4.5h -> <5h
      session(11, 0, 11, 5), // 5h -> 5-5.5h
      session(12, 0, 12, 6, 0, 15), // 6.25 -> 6-6.5h
      session(13, 0, 13, 8), // 8h -> 8h+
    ]);
    const buckets = a.durationBuckets(a.records);
    expect(buckets.map((b) => b.count)).toEqual([1, 1, 0, 1, 0, 0, 0, 1]);
    expect(buckets[0].share).toBeCloseTo(0.25, 10);
    expect(buckets.map((b) => b.label)).toEqual([
      '<5h',
      '5-5.5h',
      '5.5-6h',
      '6-6.5h',
      '6.5-7h',
      '7-7.5h',
      '7.5-8h',
      '8h+',
    ]);
  });
});

describe('sleep alignment score', () => {
  test('perfect nights score 100 with all components at 1', () => {
    const nights = Array.from({ length: 3 }, (_, i) => session(i + 10, 22, i + 11, 7));
    const a = analyzer(nights);
    const series = a.sleepAlignmentSeries(a.records);
    expect(series).toHaveLength(3);
    for (const point of series) {
      expect(point.durationScore).toBeCloseTo(1, 10);
      expect(point.timingScore).toBeCloseTo(1, 10);
      expect(point.phaseScore).toBeCloseTo(1, 10);
      expect(point.consistencyScore).toBeCloseTo(1, 10);
      expect(point.dailyScore).toBeCloseTo(100, 6);
      expect(point.trendScore).toBeCloseTo(100, 6);
    }
  });

  test('duration component uses asymmetric gaussian scales (1.25 short / 2.0 long)', () => {
    // 8h vs 9h goal -> exp(-(1/1.25)^2); 10h -> exp(-(1/2)^2)
    const short = analyzer([session(10, 22, 11, 6)]); // 8h
    const long = analyzer([session(10, 22, 11, 8)]); // 10h
    expect(short.sleepAlignmentSeries(short.records)[0].durationScore).toBeCloseTo(
      Math.exp(-((1 / 1.25) ** 2)),
      10
    );
    expect(long.sleepAlignmentSeries(long.records)[0].durationScore).toBeCloseTo(
      Math.exp(-0.25),
      10
    );
  });

  test('ema trend smooths with 0.8 previous + 0.2 daily', () => {
    // first night perfect, second night poor
    const a = analyzer([session(10, 22, 11, 7), session(11, 2, 12, 6)]);
    const series = a.sleepAlignmentSeries(a.records);
    const expectedTrend = 0.8 * series[0].trendScore + 0.2 * series[1].dailyScore;
    expect(series[1].trendScore).toBeCloseTo(expectedTrend, 8);
  });

  test('weighted geometric mean drops sub-threshold components and renormalizes', () => {
    // a single 1-hour night: timing overlap 1/9 ~ 0.111 stays; phase ~ exp(-0.5*(4/1.5)^2) ~ 0.028 stays
    // duration exp(-(8/1.25)^2) ~ 5e-18 -> dropped
    const a = analyzer([session(10, 22, 10, 23)]);
    const p = a.sleepAlignmentSeries(a.records)[0];
    expect(p.durationScore).toBeLessThan(0.01);
    const activeWeight = 0.3 + 0.2 + 0.15;
    const expected =
      100 *
      (p.timingScore ** (0.3 / activeWeight) *
        p.phaseScore ** (0.2 / activeWeight) *
        p.consistencyScore ** (0.15 / activeWeight));
    expect(p.dailyScore).toBeCloseTo(expected, 8);
  });

  test('alignment weights sum to 1', () => {
    expect(0.35 + 0.3 + 0.2 + 0.15).toBeCloseTo(1, 12);
  });
});
