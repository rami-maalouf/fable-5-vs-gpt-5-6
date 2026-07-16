import type { SleepSession } from '../src/domain/models';
import { createSleepLogRow } from '../src/components/logs/sleep-log-model';

function session(overrides: Partial<SleepSession> = {}): SleepSession {
  return {
    id: 'log-1',
    tag: 'Sleep',
    startTime: Date.UTC(2026, 6, 15, 3, 0),
    endTime: Date.UTC(2026, 6, 15, 9, 36),
    startTimeZone: 'UTC',
    endTimeZone: 'UTC',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('sleep log row model', () => {
  it('formats wake day, local clock range, and a full duration badge', () => {
    expect(createSleepLogRow(session())).toEqual({
      dateLabel: 'Wed, Jul 15',
      durationLabel: '6h 36m',
      endLabel: '9:36 AM',
      id: 'log-1',
      startLabel: '3:00 AM',
    });
  });

  it('uses the stored wake timezone for the entire display row', () => {
    expect(
      createSleepLogRow(
        session({
          startTime: Date.UTC(2026, 6, 15, 5, 30),
          endTime: Date.UTC(2026, 6, 15, 12, 35),
          startTimeZone: 'Asia/Tokyo',
          endTimeZone: 'America/Edmonton',
        }),
      ),
    ).toMatchObject({
      dateLabel: 'Wed, Jul 15',
      durationLabel: '7h 5m',
      endLabel: '6:35 AM',
      startLabel: '11:30 PM',
    });
  });
});
