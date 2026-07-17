import { defaultSleepSettings } from '@/domain/models';

import {
  buildWindDownTrigger,
  syncWindDownReminder,
  windDownMessages,
} from './notifications';

function createApi(permission: { granted: boolean; status: string } = { granted: true, status: 'granted' }) {
  const scheduled = new Map<string, { content: { data?: Record<string, unknown> }; identifier: string }>();
  let nextId = 0;
  let permissionRequests = 0;

  return {
    api: {
      async cancelScheduledNotificationAsync(id: string) {
        scheduled.delete(id);
      },
      async getAllScheduledNotificationsAsync() {
        return [...scheduled.values()];
      },
      async getPermissionsAsync() {
        return permission;
      },
      async requestPermissionsAsync() {
        permissionRequests += 1;
        return permission;
      },
      async scheduleNotificationAsync(request: { content: { data?: Record<string, unknown> } }) {
        const id = `notification-${nextId}`;
        nextId += 1;
        scheduled.set(id, { content: request.content, identifier: id });
        return id;
      },
      async setNotificationChannelAsync() {
        return null;
      },
    },
    getPermissionRequests: () => permissionRequests,
    scheduled,
  };
}

describe('notifications service', () => {
  it('builds a daily trigger three hours before bedtime', () => {
    expect(buildWindDownTrigger(22 * 60)).toEqual({ hour: 19, minute: 0, type: 'daily' });
    expect(buildWindDownTrigger(1 * 60 + 30)).toEqual({ hour: 22, minute: 30, type: 'daily' });
  });

  it('exposes ten wind-down reminder messages', () => {
    expect(windDownMessages).toHaveLength(10);
  });

  it('schedules one wind-down reminder and replaces stale reminders', async () => {
    const { api, scheduled } = createApi();

    await syncWindDownReminder(defaultSleepSettings, { api });
    await syncWindDownReminder({ ...defaultSleepSettings, optimalSleepMinutes: 23 * 60 }, { api });

    expect(scheduled.size).toBe(1);
    expect([...scheduled.values()][0].content.data).toMatchObject({ twilightKind: 'windDownReminder' });
  });

  it('cancels wind-down reminders when disabled', async () => {
    const { api, scheduled } = createApi();

    await syncWindDownReminder(defaultSleepSettings, { api });
    await syncWindDownReminder({ ...defaultSleepSettings, windDownEnabled: false }, { api });

    expect(scheduled.size).toBe(0);
  });

  it('does not schedule when permission is denied', async () => {
    const { api, scheduled } = createApi({ granted: false, status: 'denied' });

    const result = await syncWindDownReminder(defaultSleepSettings, { api, requestPermission: true });

    expect(result).toEqual({ reason: 'permission-denied', scheduled: false });
    expect(scheduled.size).toBe(0);
  });

  it('does not prompt on launch resync', async () => {
    const { api, getPermissionRequests } = createApi({ granted: false, status: 'denied' });

    await syncWindDownReminder(defaultSleepSettings, { api });

    expect(getPermissionRequests()).toBe(0);
  });
});
