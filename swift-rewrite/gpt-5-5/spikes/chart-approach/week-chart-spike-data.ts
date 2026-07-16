export type WeekChartSpikeDatum = {
  day: string;
  durationLabel: string;
  durationHours: number;
  bedtimeMinutes: number;
  wakeMinutes: number;
  bedtimeChartHour: number;
  wakeChartHour: number;
};

export const weekChartSpikeRules = {
  bedtime: {
    label: '12:30 AM',
    chartHour: clockMinutesToChartHour(30),
  },
  wake: {
    label: '7:30 AM',
    chartHour: clockMinutesToChartHour(7 * 60 + 30),
  },
  goal: {
    label: '7.0h',
    chartHour: 7,
  },
} as const;

export const weekChartSpikeData = [
  createWeekChartSpikeDatum('Thu', 6.9, 1 * 60 + 55, 8 * 60 + 50),
  createWeekChartSpikeDatum('Fri', 6.6, 4 * 60, 10 * 60 + 35),
  createWeekChartSpikeDatum('Sat', 8.0, 1 * 60 + 45, 9 * 60 + 45),
  createWeekChartSpikeDatum('Sun', 7.6, 2 * 60 + 40, 10 * 60 + 15),
  createWeekChartSpikeDatum('Mon', 6.3, 3 * 60 + 30, 9 * 60 + 45),
  createWeekChartSpikeDatum('Tue', 7.1, 2 * 60 + 20, 9 * 60 + 25),
  createWeekChartSpikeDatum('Wed', 6.6, 2 * 60 + 55, 9 * 60 + 30),
] as const satisfies readonly WeekChartSpikeDatum[];

export function clockMinutesToChartHour(minutesAfterMidnight: number) {
  const normalized = ((minutesAfterMidnight % 1440) + 1440) % 1440;
  return 12 - normalized / 60;
}

export function createWeekChartSpikeDatum(
  day: string,
  durationHours: number,
  bedtimeMinutes: number,
  wakeMinutes: number,
): WeekChartSpikeDatum {
  return {
    day,
    durationLabel: `${durationHours.toFixed(1)}h`,
    durationHours,
    bedtimeMinutes,
    wakeMinutes,
    bedtimeChartHour: clockMinutesToChartHour(bedtimeMinutes),
    wakeChartHour: clockMinutesToChartHour(wakeMinutes),
  };
}

export function formatRightAxisClock(chartHour: number) {
  const hour = Math.round(12 - chartHour);
  return `${hour === 0 ? 12 : hour} AM`;
}
