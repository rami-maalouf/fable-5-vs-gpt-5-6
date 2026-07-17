// ports: Utils/WindDownNotificationManager.swift
// daily wind-down reminder 3 hours before bedtime via expo-notifications
import * as Notifications from 'expo-notifications';

import { WIND_DOWN_MESSAGES, WIND_DOWN_TITLE, windDownReminderTime } from '../copy/winddown';

const NOTIFICATION_IDENTIFIER = 'wind-down-reminder';

export async function cancelWindDownNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);
}

export async function scheduleWindDownNotification(optimalSleepMinutes: number): Promise<void> {
  await cancelWindDownNotification();

  const permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) return;

  const { hour, minute } = windDownReminderTime(optimalSleepMinutes);
  const body = WIND_DOWN_MESSAGES[Math.floor(Math.random() * WIND_DOWN_MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDENTIFIER,
    content: { title: WIND_DOWN_TITLE, body, sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// ports updateNotification(): schedule when enabled, cancel when disabled
export async function updateWindDownNotification(
  enabled: boolean,
  optimalSleepMinutes: number
): Promise<void> {
  if (enabled) {
    await scheduleWindDownNotification(optimalSleepMinutes);
  } else {
    await cancelWindDownNotification();
  }
}
