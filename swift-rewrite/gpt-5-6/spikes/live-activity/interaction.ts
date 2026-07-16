import type { UserInteractionEvent } from 'expo-widgets';

export const SLEEP_ACTIVITY_SOURCE = 'SleepSessionActivity';
export const WAKE_ACTIVITY_TARGET = 'wake-up';

export function isWakeInteraction(event: UserInteractionEvent): boolean {
  return event.source === SLEEP_ACTIVITY_SOURCE && event.target === WAKE_ACTIVITY_TARGET;
}
