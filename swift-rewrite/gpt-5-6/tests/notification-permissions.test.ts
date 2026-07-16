jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 5 },
  IosAuthorizationStatus: {
    AUTHORIZED: 2,
    DENIED: 1,
    EPHEMERAL: 4,
    NOT_DETERMINED: 0,
    PROVISIONAL: 3,
  },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

import type { NotificationPermissionsStatus } from 'expo-notifications';
import { IosAuthorizationStatus } from 'expo-notifications';

import {
  allowsNotifications,
  type NotificationPermissionClient,
  requestNotificationPermission,
} from '@/services/notification-permissions';

function permissionStatus(
  granted: boolean,
  iosStatus?: IosAuthorizationStatus,
): NotificationPermissionsStatus {
  return {
    canAskAgain: true,
    expires: 'never',
    granted,
    status: (granted ? 'granted' : 'denied') as NotificationPermissionsStatus['status'],
    ...(iosStatus === undefined
      ? {}
      : {
          ios: {
            status: iosStatus,
          } as NotificationPermissionsStatus['ios'],
        }),
  };
}

describe('notification permissions', () => {
  it('accepts standard, provisional, and ephemeral authorization', () => {
    expect(allowsNotifications(permissionStatus(true))).toBe(true);
    expect(allowsNotifications(permissionStatus(false, IosAuthorizationStatus.AUTHORIZED))).toBe(true);
    expect(allowsNotifications(permissionStatus(false, IosAuthorizationStatus.PROVISIONAL))).toBe(true);
    expect(allowsNotifications(permissionStatus(false, IosAuthorizationStatus.EPHEMERAL))).toBe(true);
    expect(allowsNotifications(permissionStatus(false, IosAuthorizationStatus.DENIED))).toBe(false);
  });

  it('creates the Android channel before asking for permission', async () => {
    const events: string[] = [];
    const client: NotificationPermissionClient = {
      getPermissionsAsync: async () => permissionStatus(false),
      requestPermissionsAsync: async () => {
        events.push('request');
        return permissionStatus(true);
      },
      setNotificationChannelAsync: async () => {
        events.push('channel');
      },
    };

    await expect(requestNotificationPermission(client, 'android')).resolves.toBe(true);
    expect(events).toEqual(['channel', 'request']);
  });

  it('requests alert, badge, and sound access on iOS', async () => {
    let receivedRequest: unknown;
    const client: NotificationPermissionClient = {
      getPermissionsAsync: async () => permissionStatus(false),
      requestPermissionsAsync: async (request) => {
        receivedRequest = request;
        return permissionStatus(false, IosAuthorizationStatus.PROVISIONAL);
      },
      setNotificationChannelAsync: async () => undefined,
    };

    await expect(requestNotificationPermission(client, 'ios')).resolves.toBe(true);
    expect(receivedRequest).toEqual({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  });
});
