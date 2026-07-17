// ports: Utils/WindDownNotificationManager.swift - messages verbatim (active)
// pure ts
export const WIND_DOWN_TITLE = 'Wind Down Time 🌙';

export const WIND_DOWN_MESSAGES = [
  'Time to dim the lights 💡 Your body needs darkness to produce melatonin!',
  '3 hours to bedtime! 🌙 Switch to lamps and put away the snacks!',
  'Wind-down mode activated! 🧘 Dim lights, no more food, relax time.',
  'Your future rested self says: turn off bright lights now! 💤',
  "Your future rested self says: let's get prepared for bed! 🛏️",
  'Evening reminder: Dim those lights and close the kitchen! 🌃',
  'Sleep prep starts now! 🛏️ Less light, no late snacks.',
  'Time to create that cozy, dim atmosphere for better sleep! ✨',
  'Pro tip: Dim lights + no eating = amazing sleep tonight! 🌟',
  'Your circadian rhythm called: please dim the lights! 🌜',
] as const;

// reminder fires daily 3 hours before the optimal sleep time
export function windDownReminderTime(optimalSleepMinutes: number): { hour: number; minute: number } {
  const sleepHour = Math.trunc(optimalSleepMinutes / 60);
  const sleepMinute = optimalSleepMinutes % 60;
  let reminderHour = sleepHour - 3;
  if (reminderHour < 0) reminderHour += 24;
  return { hour: reminderHour, minute: sleepMinute };
}
