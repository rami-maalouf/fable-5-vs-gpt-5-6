export const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === '1';

const durations = [7.8, 8.1, 7.6, 8.25, 7.9, 8.4, 7.7, 8.15, 7.85, 8.3, 7.95, 8.05, 7.75, 8.2];

export function createDemoSleepSessions(now = Date.now()) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return durations.map((durationHours, index) => {
    const end = new Date(today);
    end.setDate(end.getDate() - index);
    end.setHours(6 + (index % 3), 35 + ((index * 7) % 20), 0, 0);
    const endTime = end.getTime();
    const startTime = endTime - durationHours * 60 * 60 * 1000;
    return { id: `demo-sleep-${index}`, startTime, endTime, timeZone };
  });
}
