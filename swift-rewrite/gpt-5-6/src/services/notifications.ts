import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  WIND_DOWN_TITLE,
  selectWindDownMessage,
} from '@/copy/winddown';
import { allowsNotifications } from '@/services/notification-permissions';

const MINUTES_PER_DAY = 24 * 60;
const WIND_DOWN_LEAD_MINUTES = 3 * 60;
const WIND_DOWN_KIND = 'twilight.wind-down';
const WIND_DOWN_PREVIEW_KIND = 'twilight.wind-down.preview';
const WIND_DOWN_CHANNEL_ID = 'wind-down';

export interface WindDownNotificationClient {
  cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  getAllScheduledNotificationsAsync(): Promise<Notifications.NotificationRequest[]>;
  getPermissionsAsync(): Promise<Notifications.NotificationPermissionsStatus>;
  scheduleNotificationAsync(request: Notifications.NotificationRequestInput): Promise<string>;
  setNotificationChannelAsync(
    channelId: string,
    channel: Notifications.NotificationChannelInput,
  ): Promise<unknown>;
}

const defaultClient: WindDownNotificationClient = {
  cancelScheduledNotificationAsync: (identifier) =>
    Notifications.cancelScheduledNotificationAsync(identifier),
  getAllScheduledNotificationsAsync: () => Notifications.getAllScheduledNotificationsAsync(),
  getPermissionsAsync: () => Notifications.getPermissionsAsync(),
  scheduleNotificationAsync: (request) => Notifications.scheduleNotificationAsync(request),
  setNotificationChannelAsync: (channelId, channel) =>
    Notifications.setNotificationChannelAsync(channelId, channel),
};

export type WindDownReconciliationResult =
  | { status: 'disabled' | 'permission-denied' }
  | { identifier: string; status: 'scheduled' };

export function calculateWindDownMinutes(bedtimeMinutes: number): number {
  const rounded = Math.round(bedtimeMinutes - WIND_DOWN_LEAD_MINUTES);
  return ((rounded % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function configureWindDownNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function getScheduledWindDownNotifications(
  client: WindDownNotificationClient = defaultClient,
): Promise<Notifications.NotificationRequest[]> {
  const scheduled = await client.getAllScheduledNotificationsAsync();
  return scheduled.filter(isAnyWindDownRequest);
}

export async function reconcileWindDownNotification({
  bedtimeMinutes,
  client = defaultClient,
  enabled,
  platform = Platform.OS,
  random = Math.random,
}: {
  bedtimeMinutes: number;
  client?: WindDownNotificationClient;
  enabled: boolean;
  platform?: typeof Platform.OS;
  random?: () => number;
}): Promise<WindDownReconciliationResult> {
  const scheduled = await client.getAllScheduledNotificationsAsync();
  const dailyRequests = scheduled.filter(isDailyWindDownRequest);

  if (!enabled) {
    await cancelRequests(client, scheduled.filter(isAnyWindDownRequest));
    return { status: 'disabled' };
  }

  const permissions = await client.getPermissionsAsync();
  if (!allowsNotifications(permissions)) {
    await cancelRequests(client, scheduled.filter(isAnyWindDownRequest));
    return { status: 'permission-denied' };
  }

  if (platform === 'android') {
    await client.setNotificationChannelAsync(WIND_DOWN_CHANNEL_ID, {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'Wind-down reminders',
    });
  }

  const windDownMinutes = calculateWindDownMinutes(bedtimeMinutes);
  // expo sdk 57 requires object triggers to declare their schedulable type.
  // source: https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#dailytriggerinput
  const trigger: Notifications.DailyTriggerInput = {
    hour: Math.floor(windDownMinutes / 60),
    minute: windDownMinutes % 60,
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    ...(platform === 'android' ? { channelId: WIND_DOWN_CHANNEL_ID } : {}),
  };
  const identifier = await client.scheduleNotificationAsync({
    content: windDownContent(WIND_DOWN_KIND, random),
    trigger,
  });

  await cancelRequests(client, dailyRequests);
  return { identifier, status: 'scheduled' };
}

export async function scheduleWindDownPreviewNotification({
  client = defaultClient,
  platform = Platform.OS,
  random = () => 0,
  seconds = 5,
}: {
  client?: WindDownNotificationClient;
  platform?: typeof Platform.OS;
  random?: () => number;
  seconds?: number;
} = {}): Promise<string> {
  if (platform === 'android') {
    await client.setNotificationChannelAsync(WIND_DOWN_CHANNEL_ID, {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'Wind-down reminders',
    });
  }
  return client.scheduleNotificationAsync({
    content: windDownContent(WIND_DOWN_PREVIEW_KIND, random),
    trigger: {
      seconds,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      ...(platform === 'android' ? { channelId: WIND_DOWN_CHANNEL_ID } : {}),
    },
  });
}

function windDownContent(kind: string, random: () => number): Notifications.NotificationContentInput {
  return {
    body: selectWindDownMessage(random),
    data: { kind },
    sound: 'default',
    title: WIND_DOWN_TITLE,
  };
}

function isDailyWindDownRequest(request: Notifications.NotificationRequest): boolean {
  return request.content.data?.kind === WIND_DOWN_KIND;
}

function isAnyWindDownRequest(request: Notifications.NotificationRequest): boolean {
  const kind = request.content.data?.kind;
  return kind === WIND_DOWN_KIND || kind === WIND_DOWN_PREVIEW_KIND;
}

async function cancelRequests(
  client: WindDownNotificationClient,
  requests: Notifications.NotificationRequest[],
): Promise<void> {
  await Promise.all(
    requests.map((request) => client.cancelScheduledNotificationAsync(request.identifier)),
  );
}
