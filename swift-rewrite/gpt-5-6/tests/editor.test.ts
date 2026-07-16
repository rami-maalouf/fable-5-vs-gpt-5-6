import type { SleepSession } from '../src/domain/models';
import {
  buildEditorTimestamps,
  createEditorValueFromSession,
  zonedMinuteToTimestamp,
} from '../src/components/logs/log-editor-model';

describe('log editor calendar crossover', () => {
  it('places a late bedtime on the day before its wake day', () => {
    expect(
      buildEditorTimestamps({
        endTimeZone: 'UTC',
        sleepMinutes: 23 * 60,
        startTimeZone: 'UTC',
        wakeDayKey: '2026-07-16',
        wakeMinutes: 7 * 60,
      }),
    ).toEqual({
      endTime: Date.UTC(2026, 6, 16, 7),
      startTime: Date.UTC(2026, 6, 15, 23),
    });
  });

  it('keeps an after-midnight bedtime on the wake day', () => {
    expect(
      buildEditorTimestamps({
        endTimeZone: 'UTC',
        sleepMinutes: 60,
        startTimeZone: 'UTC',
        wakeDayKey: '2026-07-16',
        wakeMinutes: 7 * 60,
      }),
    ).toEqual({
      endTime: Date.UTC(2026, 6, 16, 7),
      startTime: Date.UTC(2026, 6, 16, 1),
    });
  });

  it('resolves DST and rejects a nonexistent wall-clock minute', () => {
    const timestamps = buildEditorTimestamps({
      endTimeZone: 'America/Edmonton',
      sleepMinutes: 23 * 60,
      startTimeZone: 'America/Edmonton',
      wakeDayKey: '2026-03-08',
      wakeMinutes: 7 * 60,
    });
    expect(timestamps.endTime - timestamps.startTime).toBe(7 * 60 * 60 * 1_000);
    expect(() =>
      zonedMinuteToTimestamp('2026-03-08', 2 * 60 + 30, 'America/Edmonton'),
    ).toThrow('does not exist');
  });
});

describe('log editor session values', () => {
  it('reads each endpoint in its own stored timezone', () => {
    const session: SleepSession = {
      id: 'travel',
      tag: 'Manual Log',
      startTime: Date.UTC(2026, 6, 15, 14),
      endTime: Date.UTC(2026, 6, 16, 13),
      startTimeZone: 'Asia/Tokyo',
      endTimeZone: 'America/Edmonton',
      createdAt: 1,
      updatedAt: 1,
    };
    expect(createEditorValueFromSession(session)).toEqual({
      endTimeZone: 'America/Edmonton',
      sleepMinutes: 23 * 60,
      startTimeZone: 'Asia/Tokyo',
      wakeDayKey: '2026-07-16',
      wakeMinutes: 7 * 60,
    });
  });
});
