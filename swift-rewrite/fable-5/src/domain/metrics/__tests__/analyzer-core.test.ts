// ports behavior of: Utils/SleepMetricsAnalyzer.swift (core stats, task 14)
import type { SleepSession } from '../../models';
import { SleepMetricsAnalyzer, buildNightRecords, goalDurationHours } from '../analyzer';

const TZ = 'America/Denver';
// mst in january: utc-7
const mstMs = (day: number, hour: number, minute = 0) =>
  Date.UTC(2025, 0, day, hour + 7, minute);

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

describe('night records (canonical sessions)', () => {
  test('one record per wake day, longest session wins, sorted ascending', () => {
    const nap = session(15, 14, 15, 15); // 1h nap on jan 15
    const night = session(14, 23, 15, 7); // 8h night waking jan 15
    const other = session(16, 0, 16, 8); // 8h waking jan 16
    const records = buildNightRecords([other, nap, night]);
    expect(records).toHaveLength(2);
    expect(records[0].date).toEqual({ year: 2025, month: 1, day: 15 });
    expect(records[0].durationHours).toBe(8);
    expect(records[1].date).toEqual({ year: 2025, month: 1, day: 16 });
  });

  test('offsets are computed against the 18:00 base in session timezones', () => {
    const records = buildNightRecords([session(14, 23, 15, 7)]);
    expect(records[0].bedtimeOffset).toBe(5); // 23:00 -> 5h after 18:00
    expect(records[0].wakeOffset).toBe(13); // 07:00 next day
    expect(records[0].midpointOffset).toBe(9); // 5 + 8/2
  });

  test('weekday is the wake day weekday, 1 = sunday', () => {
    // jan 19 2025 is a sunday
    const records = buildNightRecords([session(18, 23, 19, 7)]);
    expect(records[0].weekday).toBe(1);
  });

  test('invalid and active sessions are excluded', () => {
    const short = { ...session(15, 3, 15, 3), endTime: mstMs(15, 3) + 200_000 };
    const active = { ...session(16, 23, 17, 7), endTime: null };
    expect(buildNightRecords([short, active])).toHaveLength(0);
  });
});

describe('goal duration', () => {
  test('22:00 -> 07:00 = 9h; defaults to 8h without targets', () => {
    expect(goalDurationHours(22 * 60, 7 * 60)).toBe(9);
    expect(goalDurationHours(null, null)).toBe(8);
  });
});

describe('basic stats', () => {
  const sessions = [
    session(14, 23, 15, 7), // 8h
    session(15, 23, 16, 5), // 6h
    session(16, 22, 17, 8), // 10h
  ];

  test('average / median / total / longest / shortest', () => {
    const a = analyzer(sessions);
    expect(a.averageDuration(a.records)).toBe(8);
    expect(a.medianDuration(a.records)).toBe(8);
    expect(a.totalSleepHours(a.records)).toBe(24);
    expect(a.longestNight(a.records)).toBe(10);
    expect(a.shortestNight(a.records)).toBe(6);
  });

  test('median of an even count averages the middle two', () => {
    const a = analyzer([...sessions, session(17, 23, 18, 6)]); // +7h
    expect(a.medianDuration(a.records)).toBe(7.5);
  });

  test('empty inputs return null', () => {
    const a = analyzer([]);
    expect(a.averageDuration(a.records)).toBeNull();
    expect(a.medianDuration(a.records)).toBeNull();
    expect(a.longestNight(a.records)).toBeNull();
    expect(a.shortestNight(a.records)).toBeNull();
    expect(a.totalSleepHours(a.records)).toBe(0);
  });
});

describe('ranges and coverage', () => {
  test('recordsIn(30D) keeps only the last 30 days from today', () => {
    const inRange = session(18, 23, 19, 7);
    const old = {
      ...session(18, 23, 19, 7),
      startTime: Date.UTC(2024, 10, 1, 6),
      endTime: Date.UTC(2024, 10, 1, 14),
    };
    const a = analyzer([inRange, old]);
    expect(a.records).toHaveLength(2);
    expect(a.recordsIn('30D')).toHaveLength(1);
    expect(a.recordsIn('All')).toHaveLength(2);
  });

  test('coverage is nights / range days, rounded', () => {
    const a = analyzer([session(14, 23, 15, 7), session(15, 23, 16, 7), session(16, 23, 17, 7)]);
    expect(a.trackingCoverage(a.recordsIn('30D'), '30D')).toBe(10); // 3/30
  });

  test('coverage for All uses the tracked span (first day to today)', () => {
    const a = analyzer([session(14, 23, 15, 7), session(15, 23, 16, 7)]);
    // first tracked jan 15, today jan 20 -> 6 days; 2/6 = 33
    expect(a.dataRangeDays).toBe(6);
    expect(a.trackingCoverage(a.recordsIn('All'), 'All')).toBe(33);
  });
});

describe('goal hit rate (±0.75h inclusive)', () => {
  test('boundary counts as a hit', () => {
    // goal is 9h: 8.25 hits (== tolerance), 8.24 misses
    const hit = session(14, 22, 15, 6, 0, 15); // 8.25h
    const miss = session(15, 22, 16, 6, 0, 14); // ~8.23h
    const a = analyzer([hit, miss]);
    expect(a.goalHitRate(a.records)).toBe(50);
  });
});

describe('duration trend percent (7-night windows)', () => {
  test('null with fewer than 14 records, computed otherwise', () => {
    const sessions: SleepSession[] = [];
    // 7 nights of 6h, then 7 nights of 9h -> +50%
    for (let i = 0; i < 7; i++) sessions.push(session(i + 1, 0, i + 1, 6));
    for (let i = 7; i < 14; i++) sessions.push(session(i + 1, 0, i + 1, 9));
    const a = analyzer(sessions);
    expect(a.durationTrendPercent(a.records)).toBeCloseTo(50, 10);
    expect(a.durationTrendPercent(a.records.slice(0, 13))).toBeNull();
  });
});

describe('7-day moving average series', () => {
  test('null until the window fills, then rolling mean', () => {
    const sessions: SleepSession[] = [];
    for (let i = 0; i < 8; i++) sessions.push(session(i + 1, 0, i + 1, i + 1)); // 1h,2h,...8h
    const a = analyzer(sessions);
    const series = a.movingAverageSeries(a.records);
    expect(series[5].movingAverageHours).toBeNull();
    expect(series[6].movingAverageHours).toBeCloseTo(4, 10); // mean 1..7
    expect(series[7].movingAverageHours).toBeCloseTo(5, 10); // mean 2..8
  });
});

describe('streaks', () => {
  test('current streak counts back from today or yesterday', () => {
    // nights waking jan 18, 19, 20 (today)
    const a = analyzer([session(17, 23, 18, 7), session(18, 23, 19, 7), session(19, 23, 20, 7)]);
    expect(a.currentStreak()).toBe(3);
  });

  test('streak alive if tracked yesterday but not today', () => {
    const a = analyzer([session(17, 23, 18, 7), session(18, 23, 19, 7)]);
    expect(a.currentStreak()).toBe(2);
  });

  test('zero when neither today nor yesterday tracked', () => {
    const a = analyzer([session(14, 23, 15, 7)]);
    expect(a.currentStreak()).toBe(0);
  });

  test('longest streak finds the best consecutive run', () => {
    const a = analyzer([
      session(9, 23, 10, 7),
      session(10, 23, 11, 7),
      session(11, 23, 12, 7),
      session(14, 23, 15, 7),
      session(15, 23, 16, 7),
    ]);
    expect(a.longestStreak()).toBe(3);
  });
});
