jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  IosAuthorizationStatus: {
    AUTHORIZED: 2,
    DENIED: 1,
    EPHEMERAL: 4,
    NOT_DETERMINED: 0,
    PROVISIONAL: 3,
  },
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    TIME_INTERVAL: 'timeInterval',
  },
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

import type {
  NotificationPermissionsStatus,
  NotificationRequest,
  NotificationRequestInput,
} from 'expo-notifications';
import { IosAuthorizationStatus } from 'expo-notifications';

import { WIND_DOWN_MESSAGES, WIND_DOWN_TITLE } from '@/copy/winddown';
import {
  calculateWindDownMinutes,
  reconcileWindDownNotification,
  scheduleWindDownPreviewNotification,
  type WindDownNotificationClient,
} from '@/services/notifications';

function permissionStatus(authorized: boolean): NotificationPermissionsStatus {
  return {
    canAskAgain: !authorized,
    expires: 'never',
    granted: authorized,
    ios: {
      status: authorized
        ? IosAuthorizationStatus.AUTHORIZED
        : IosAuthorizationStatus.DENIED,
    } as NotificationPermissionsStatus['ios'],
    status: (authorized ? 'granted' : 'denied') as NotificationPermissionsStatus['status'],
  };
}

function request(identifier: string, kind?: string): NotificationRequest {
  return {
    content: {
      attachments: [],
      autoDismiss: true,
      badge: null,
      body: 'body',
      categoryIdentifier: '',
      data: kind ? { kind } : {},
      sound: null,
      subtitle: null,
      title: 'title',
    },
    identifier,
    trigger: null,
  } as unknown as NotificationRequest;
}

function createClient({
  authorized = true,
  scheduled = [],
}: {
  authorized?: boolean;
  scheduled?: NotificationRequest[];
} = {}) {
  const events: string[] = [];
  const requests: NotificationRequestInput[] = [];
  const client: WindDownNotificationClient = {
    cancelScheduledNotificationAsync: async (identifier) => {
      events.push(`cancel:${identifier}`);
    },
    getAllScheduledNotificationsAsync: async () => scheduled,
    getPermissionsAsync: async () => permissionStatus(authorized),
    scheduleNotificationAsync: async (notification) => {
      events.push('schedule');
      requests.push(notification);
      return 'new-wind-down';
    },
    setNotificationChannelAsync: async () => {
      events.push('channel');
    },
  };
  return { client, events, requests };
}

describe('wind-down notifications', () => {
  it('ports the complete notification copy bank', () => {
    expect(WIND_DOWN_TITLE).toBe('Wind Down Time 🌙');
    expect(WIND_DOWN_MESSAGES).toHaveLength(10);
    expect(new Set(WIND_DOWN_MESSAGES).size).toBe(10);
    expect(WIND_DOWN_MESSAGES.every((message) => message.length > 20)).toBe(true);
  });

  it('normalizes a three-hour offset across midnight', () => {
    expect(calculateWindDownMinutes(22 * 60 + 30)).toBe(19 * 60 + 30);
    expect(calculateWindDownMinutes(2 * 60)).toBe(23 * 60);
  });

  it('replaces only tagged Twilight requests with one daily trigger', async () => {
    const { client, events, requests } = createClient({
      scheduled: [
        request('old-wind-down', 'twilight.wind-down'),
        request('duplicate-wind-down', 'twilight.wind-down'),
        request('other-app-request'),
      ],
    });

    await expect(
      reconcileWindDownNotification({
        bedtimeMinutes: 22 * 60 + 30,
        client,
        enabled: true,
        platform: 'ios',
        random: () => 0,
      }),
    ).resolves.toEqual({ identifier: 'new-wind-down', status: 'scheduled' });

    expect(events).toEqual([
      'schedule',
      'cancel:old-wind-down',
      'cancel:duplicate-wind-down',
    ]);
    expect(requests).toEqual([
      {
        content: {
          body: WIND_DOWN_MESSAGES[0],
          data: { kind: 'twilight.wind-down' },
          sound: 'default',
          title: WIND_DOWN_TITLE,
        },
        trigger: { hour: 19, minute: 30, type: 'daily' },
      },
    ]);
  });

  it('creates the Android channel and assigns it to the daily trigger', async () => {
    const { client, events, requests } = createClient();

    await reconcileWindDownNotification({
      bedtimeMinutes: 60,
      client,
      enabled: true,
      platform: 'android',
    });

    expect(events.slice(0, 2)).toEqual(['channel', 'schedule']);
    expect(requests[0].trigger).toEqual({
      channelId: 'wind-down',
      hour: 22,
      minute: 0,
      type: 'daily',
    });
  });

  it.each([
    ['disabled', false, true],
    ['permission-denied', true, false],
  ] as const)('cancels tagged requests when %s', async (status, enabled, authorized) => {
    const { client, events, requests } = createClient({
      authorized,
      scheduled: [request('wind-down', 'twilight.wind-down'), request('other')],
    });

    await expect(
      reconcileWindDownNotification({ bedtimeMinutes: 22 * 60, client, enabled }),
    ).resolves.toEqual({ status });
    expect(events).toEqual(['cancel:wind-down']);
    expect(requests).toHaveLength(0);
  });

  it('schedules a shortened one-shot preview without changing the daily request', async () => {
    const { client, requests } = createClient();

    await expect(
      scheduleWindDownPreviewNotification({ client, platform: 'ios', seconds: 5 }),
    ).resolves.toBe('new-wind-down');
    expect(requests[0]).toEqual({
      content: {
        body: WIND_DOWN_MESSAGES[0],
        data: { kind: 'twilight.wind-down.preview' },
        sound: 'default',
        title: WIND_DOWN_TITLE,
      },
      trigger: { seconds: 5, type: 'timeInterval' },
    });
  });

  it('uses the wind-down channel for an Android preview', async () => {
    const { client, events, requests } = createClient();

    await scheduleWindDownPreviewNotification({ client, platform: 'android', seconds: 5 });

    expect(events).toEqual(['channel', 'schedule']);
    expect(requests[0].trigger).toEqual({
      channelId: 'wind-down',
      seconds: 5,
      type: 'timeInterval',
    });
  });
});
