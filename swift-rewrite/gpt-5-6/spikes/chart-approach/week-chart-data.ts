export interface WeekChartDatum {
  day: string;
  durationLabel: string;
  durationHours: number;
  bedtimeMinutes: number;
  wakeMinutes: number;
  bedtimeChartHour: number;
  wakeChartHour: number;
}

export const weekChartRules = {
  bedtime: { chartHour: clockMinutesToChartHour(30), label: '12:30 AM' },
  duration: { chartHour: 7, label: '7.0h' },
  wake: { chartHour: clockMinutesToChartHour(7 * 60 + 30), label: '7:30 AM' },
} as const;

export const weekChartData = [
  createWeekChartDatum('Thu', 6.9, 1 * 60 + 55, 8 * 60 + 50),
  createWeekChartDatum('Fri', 6.6, 4 * 60, 10 * 60 + 35),
  createWeekChartDatum('Sat', 8, 1 * 60 + 45, 9 * 60 + 45),
  createWeekChartDatum('Sun', 7.6, 2 * 60 + 40, 10 * 60 + 15),
  createWeekChartDatum('Mon', 6.3, 3 * 60 + 30, 9 * 60 + 45),
  createWeekChartDatum('Tue', 7.1, 2 * 60 + 20, 9 * 60 + 25),
  createWeekChartDatum('Wed', 6.6, 2 * 60 + 55, 9 * 60 + 30),
] as const satisfies readonly WeekChartDatum[];

export function clockMinutesToChartHour(minutesAfterMidnight: number): number {
  const normalizedMinutes = ((minutesAfterMidnight % 1440) + 1440) % 1440;
  return 12 - normalizedMinutes / 60;
}

export function createWeekChartDatum(
  day: string,
  durationHours: number,
  bedtimeMinutes: number,
  wakeMinutes: number,
): WeekChartDatum {
  return {
    bedtimeChartHour: clockMinutesToChartHour(bedtimeMinutes),
    bedtimeMinutes,
    day,
    durationHours,
    durationLabel: `${durationHours.toFixed(1)}h`,
    wakeChartHour: clockMinutesToChartHour(wakeMinutes),
    wakeMinutes,
  };
}

export function formatChartClock(chartHour: number): string {
  const minutesAfterMidnight = Math.round((12 - chartHour) * 60);
  const hour = Math.floor(minutesAfterMidnight / 60) % 24;
  const minute = minutesAfterMidnight % 60;
  const displayHour = hour % 12 || 12;
  return `${displayHour}${minute === 0 ? '' : `:${String(minute).padStart(2, '0')}`} ${hour < 12 ? 'AM' : 'PM'}`;
}
