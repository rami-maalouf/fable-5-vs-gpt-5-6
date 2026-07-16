// ports behavior of: Views/SleepDataModels.swift (process + weekly scores)
import type { SleepSession } from '../../models';
import {
  averageWeekDurationSeconds,
  processWeekData,
  weekAccuracy,
  weekSleepConsistency,
} from '../week-data';

const TZ = 'America/Denver';
const mstMs = (day: number, hour: number, minute = 0) => Date.UTC(2025, 0, day, hour + 7, minute);

let id = 0;
function session(startDay: number, startHour: number, endDay: number, endHour: number): SleepSession {
  return {
    id: `w-${id++}`,
    tag: 'Sleep Mode',
    startTime: mstMs(startDay, startHour),
    endTime: mstMs(endDay, endHour),
    startTimeZone: TZ,
    endTimeZone: TZ,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('processWeekData', () => {
  test('produces 7 days anchored at the last wake day, empty days zeroed', () => {
    const data = processWeekData([session(14, 23, 15, 7), session(17, 23, 18, 7)]);
    expect(data).toHaveLength(7);
    expect(data[6].day).toEqual({ year: 2025, month: 1, day: 18 });
    expect(data[0].day).toEqual({ year: 2025, month: 1, day: 12 });
    expect(data[3].durationSeconds).toBe(8 * 3600);
    expect(data.filter((d) => d.durationSeconds > 0)).toHaveLength(2);
  });

  test('canonical night per day (longest wins)', () => {
    const nap = session(15, 14, 15, 15);
    const night = session(14, 23, 15, 7);
    const data = processWeekData([nap, night]);
    const day15 = data.find((d) => d.day.day === 15)!;
    expect(day15.startOffset).toBe(5);
  });

  test('weekday labels follow the wake day', () => {
    // jan 19 2025 = sunday
    const data = processWeekData([session(18, 23, 19, 7)]);
    expect(data[6].dayLabel).toBe('Sun');
  });
});

describe('weekly insight scores', () => {
  test('identical nights score 100 consistency and match accuracy at target', () => {
    const nights = [session(14, 23, 15, 7), session(15, 23, 16, 7), session(16, 23, 17, 7)];
    const data = processWeekData(nights);
    expect(weekSleepConsistency(data)).toBe(100);
    expect(weekAccuracy(data, 23 * 60, 7 * 60)).toBe(100);
    // an hour off target on bedtime only: avg dev 0.5h -> -15
    expect(weekAccuracy(data, 22 * 60, 7 * 60)).toBe(85);
    expect(averageWeekDurationSeconds(data)).toBe(8 * 3600);
  });
});
