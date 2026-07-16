import { defaultSleepSettings, type SleepSession } from '@/domain/models';

import { buildMetricsScreenModel } from './metrics-screen-model';

const referenceDate = new Date('2026-07-16T18:00:00.000Z');

function session(overrides: Partial<SleepSession> = {}): SleepSession {
  return {
    createdAt: new Date('2026-07-16T13:01:00.000Z'),
    endTime: new Date('2026-07-16T13:00:00.000Z'),
    endTimeZone: 'America/Edmonton',
    id: 'session-1',
    startTime: new Date('2026-07-16T04:00:00.000Z'),
    startTimeZone: 'America/Edmonton',
    tag: null,
    updatedAt: new Date('2026-07-16T13:01:00.000Z'),
    ...overrides,
  };
}

describe('metrics screen model', () => {
  it('builds the empty shell model', () => {
    const model = buildMetricsScreenModel({
      range: '30D',
      referenceDate,
      sessions: [],
      settings: defaultSleepSettings,
    });

    expect(model.isEmpty).toBe(true);
    expect(model.overviewCards.map((card) => card.value)).toEqual(['No data', '0%', '0', '0%']);
    expect(model.footerTiles).toEqual([
      { label: 'range start', value: 'No data' },
      { label: 'tracked range', value: '0 nights' },
    ]);
  });

  it('builds overview cards and highlights from metric engine outputs', () => {
    const model = buildMetricsScreenModel({
      range: '30D',
      referenceDate,
      sessions: [session()],
      settings: defaultSleepSettings,
    });

    expect(model.isEmpty).toBe(false);
    expect(model.overviewCards).toEqual([
      expect.objectContaining({ label: 'average sleep', value: '9h' }),
      expect.objectContaining({ label: 'goal hit rate', value: '100%' }),
      expect.objectContaining({ label: 'alignment', value: '100' }),
      expect.objectContaining({ label: 'coverage', value: '3%' }),
    ]);
    expect(model.highlights).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'longest night', value: '9h' }),
      expect.objectContaining({ label: 'current streak', value: '1 night' }),
      expect.objectContaining({ label: 'sleep debt', value: '0h' }),
    ]));
    expect(model.footerTiles).toEqual([
      { label: 'range start', value: '2026-07-16' },
      { label: 'tracked range', value: '1 night' },
    ]);
  });
});
