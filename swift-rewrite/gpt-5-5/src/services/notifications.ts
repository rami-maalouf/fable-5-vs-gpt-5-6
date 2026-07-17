import type * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { SleepSettings } from '@/domain/models';
import { windDownMessages, windDownNotificationTitle } from '@/copy/winddown';

export { windDownMessages, windDownNotificationTitle };

const dayMinutes = 24 * 60;
const windDownReminderKind = 'windDownReminder';
const windDownChannelId = 'wind-down';
const defaultWindDownOffsetMinutes = 3 * 60;

type PermissionResult = {
  granted?: boolean;
  status?: string;
};

export type NotificationsApi = {
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  getAllScheduledNotificationsAsync: () => Promise<{
    identifier: string;
    content: {
      data?: Record<string, unknown>;
    };
  }[]>;
  getPermissionsAsync: () => Promise<PermissionResult>;
  requestPermissionsAsync: () => Promise<PermissionResult>;
  scheduleNotificationAsync: (request: ExpoNotifications.NotificationRequestInput) => Promise<string>;
  setNotificationChannelAsync?: (
    channelId: string,
    channel: { importance: 'default'; name: string },
  ) => Promise<unknown>;
};

export type SyncWindDownReminderOptions = {
  api?: NotificationsApi;
  messageIndex?: number;
  offsetMinutes?: number;
  requestPermission?: boolean;
};

export type SyncWindDownReminderResult =
  | { identifier: string; scheduled: true }
  | { reason: 'disabled' | 'permission-denied'; scheduled: false };

export function buildWindDownTrigger(
  bedtimeMinutes: number,
  offsetMinutes = defaultWindDownOffsetMinutes,
): ExpoNotifications.DailyTriggerInput {
  const triggerMinutes = normalizeMinutes(bedtimeMinutes - offsetMinutes);

  return {
    hour: Math.floor(triggerMinutes / 60),
    minute: triggerMinutes % 60,
    type: 'daily' as ExpoNotifications.DailyTriggerInput['type'],
  };
}

export async function cancelWindDownReminder(api?: NotificationsApi) {
  const notificationsApi = api ?? await getDefaultNotificationsApi();
  const scheduledNotifications = await notificationsApi.getAllScheduledNotificationsAsync();
  const windDownNotifications = scheduledNotifications.filter((notification) =>
    notification.content.data?.twilightKind === windDownReminderKind
  );

  await Promise.all(
    windDownNotifications.map((notification) =>
      notificationsApi.cancelScheduledNotificationAsync(notification.identifier)
    ),
  );
}

export async function syncWindDownReminder(
  settings: SleepSettings,
  {
    api,
    messageIndex = pickDailyMessageIndex(),
    offsetMinutes = defaultWindDownOffsetMinutes,
    requestPermission = false,
  }: SyncWindDownReminderOptions = {},
): Promise<SyncWindDownReminderResult> {
  const notificationsApi = api ?? await getDefaultNotificationsApi();

  await cancelWindDownReminder(notificationsApi);

  if (!settings.windDownEnabled) {
    return { reason: 'disabled', scheduled: false };
  }

  await ensureWindDownChannel(notificationsApi);

  const permission = await resolveNotificationPermission(notificationsApi, requestPermission);

  if (!isPermissionGranted(permission)) {
    return { reason: 'permission-denied', scheduled: false };
  }

  const identifier = await notificationsApi.scheduleNotificationAsync({
    content: {
      body: windDownMessages[messageIndex % windDownMessages.length],
      data: { twilightKind: windDownReminderKind },
      sound: 'default',
      title: windDownNotificationTitle,
    },
    trigger: buildWindDownTrigger(settings.optimalSleepMinutes, offsetMinutes),
  });

  return { identifier, scheduled: true };
}

async function ensureWindDownChannel(api: NotificationsApi) {
  if (Platform.OS !== 'android' || !api.setNotificationChannelAsync) {
    return;
  }

  await api.setNotificationChannelAsync(windDownChannelId, {
    importance: 'default',
    name: 'Wind-down reminders',
  });
}

async function resolveNotificationPermission(api: NotificationsApi, requestPermission: boolean) {
  const permission = await api.getPermissionsAsync();

  if (isPermissionGranted(permission) || !requestPermission) {
    return permission;
  }

  return api.requestPermissionsAsync();
}

function isPermissionGranted(permission: PermissionResult) {
  return permission.granted === true || permission.status === 'granted';
}

function normalizeMinutes(minutes: number) {
  return ((minutes % dayMinutes) + dayMinutes) % dayMinutes;
}

function pickDailyMessageIndex() {
  const today = new Date();
  return today.getFullYear() + today.getMonth() + today.getDate();
}

async function getDefaultNotificationsApi(): Promise<NotificationsApi> {
  const notifications = await import('expo-notifications');
  return notifications as unknown as NotificationsApi;
}
