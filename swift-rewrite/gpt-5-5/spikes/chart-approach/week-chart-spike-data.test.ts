import {
  clockMinutesToChartHour,
  createWeekChartSpikeDatum,
  formatRightAxisClock,
  weekChartSpikeData,
  weekChartSpikeRules,
} from './week-chart-spike-data';

describe('week chart spike data', () => {
  it('maps clock times onto the shared 0-12 chart domain', () => {
    expect(clockMinutesToChartHour(30)).toBe(11.5);
    expect(clockMinutesToChartHour(2 * 60)).toBe(10);
    expect(clockMinutesToChartHour(7 * 60 + 30)).toBe(4.5);
    expect(clockMinutesToChartHour(10 * 60)).toBe(2);
  });

  it('pins the three reference rulemarks from the dashboard screenshot', () => {
    expect(weekChartSpikeRules.bedtime).toEqual({ label: '12:30 AM', chartHour: 11.5 });
    expect(weekChartSpikeRules.wake).toEqual({ label: '7:30 AM', chartHour: 4.5 });
    expect(weekChartSpikeRules.goal).toEqual({ label: '7.0h', chartHour: 7 });
  });

  it('creates floating sleep-window bar inputs and x-axis labels', () => {
    const datum = createWeekChartSpikeDatum('Thu', 6.9, 115, 530);

    expect(datum).toMatchObject({
      day: 'Thu',
      durationLabel: '6.9h',
      durationHours: 6.9,
    });
    expect(datum.bedtimeChartHour).toBeCloseTo(10.08333);
    expect(datum.wakeChartHour).toBeCloseTo(3.16667);
    expect(weekChartSpikeData.map((datum) => `${datum.day} ${datum.durationLabel}`)).toEqual([
      'Thu 6.9h',
      'Fri 6.6h',
      'Sat 8.0h',
      'Sun 7.6h',
      'Mon 6.3h',
      'Tue 7.1h',
      'Wed 6.6h',
    ]);
  });

  it('formats the right axis as clock labels', () => {
    expect(formatRightAxisClock(10)).toBe('2 AM');
    expect(formatRightAxisClock(6)).toBe('6 AM');
    expect(formatRightAxisClock(2)).toBe('10 AM');
  });
});
