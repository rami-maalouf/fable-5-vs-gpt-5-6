import {
  clockMinutesToChartHour,
  createWeekChartDatum,
  formatChartClock,
  weekChartData,
  weekChartRules,
} from '../spikes/chart-approach/week-chart-data';

describe('week chart spike domain', () => {
  it('maps post-midnight clock times into the shared chart domain', () => {
    expect(clockMinutesToChartHour(30)).toBe(11.5);
    expect(clockMinutesToChartHour(2 * 60)).toBe(10);
    expect(clockMinutesToChartHour(7 * 60 + 30)).toBe(4.5);
    expect(clockMinutesToChartHour(10 * 60)).toBe(2);
  });

  it('pins every rulemark from the Swift reference', () => {
    expect(weekChartRules).toEqual({
      bedtime: { chartHour: 11.5, label: '12:30 AM' },
      duration: { chartHour: 7, label: '7.0h' },
      wake: { chartHour: 4.5, label: '7:30 AM' },
    });
  });

  it('creates floating bars and the exact reference labels', () => {
    const datum = createWeekChartDatum('Thu', 6.9, 115, 530);

    expect(datum).toMatchObject({ day: 'Thu', durationHours: 6.9, durationLabel: '6.9h' });
    expect(datum.bedtimeChartHour).toBeCloseTo(10.08333);
    expect(datum.wakeChartHour).toBeCloseTo(3.16667);
    expect(weekChartData.map(({ day, durationLabel }) => `${day} ${durationLabel}`)).toEqual([
      'Thu 6.9h',
      'Fri 6.6h',
      'Sat 8.0h',
      'Sun 7.6h',
      'Mon 6.3h',
      'Tue 7.1h',
      'Wed 6.6h',
    ]);
  });

  it('formats right-axis clock labels', () => {
    expect(formatChartClock(10)).toBe('2 AM');
    expect(formatChartClock(6)).toBe('6 AM');
    expect(formatChartClock(4.5)).toBe('7:30 AM');
    expect(formatChartClock(2)).toBe('10 AM');
  });
});
