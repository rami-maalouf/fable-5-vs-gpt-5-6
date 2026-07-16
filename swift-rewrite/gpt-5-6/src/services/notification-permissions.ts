// ports: twilight/views/sleeponboardingview.swift

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationPermissionClient {
  getPermissionsAsync(): Promise<Notifications.NotificationPermissionsStatus>;
  requestPermissionsAsync(
    request: Notifications.NotificationPermissionsRequest,
  ): Promise<Notifications.NotificationPermissionsStatus>;
  setNotificationChannelAsync(channelId: string, channel: { importance: number; name: string }): Promise<unknown>;
}

const defaultClient: NotificationPermissionClient = {
  getPermissionsAsync: () => Notifications.getPermissionsAsync(),
  requestPermissionsAsync: (request) => Notifications.requestPermissionsAsync(request),
  setNotificationChannelAsync: (channelId, channel) =>
    Notifications.setNotificationChannelAsync(channelId, channel),
};

export function allowsNotifications(
  permissions: Notifications.NotificationPermissionsStatus,
): boolean {
  const iosStatus = permissions.ios?.status;
  return permissions.granted ||
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL;
}

export async function getNotificationPermission(
  client: NotificationPermissionClient = defaultClient,
): Promise<boolean> {
  return allowsNotifications(await client.getPermissionsAsync());
}

export async function requestNotificationPermission(
  client: NotificationPermissionClient = defaultClient,
  platform: typeof Platform.OS = Platform.OS,
): Promise<boolean> {
  if (platform === 'android') {
    await client.setNotificationChannelAsync('wind-down', {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'Wind-down reminders',
    });
  }
  const permissions = await client.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return allowsNotifications(permissions);
}
