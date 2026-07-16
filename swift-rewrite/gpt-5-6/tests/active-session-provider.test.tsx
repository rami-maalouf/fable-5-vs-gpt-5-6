import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import type { SleepToggleRepository } from '../src/components/dashboard/sleep-toggle';
import type { SleepSession } from '../src/domain/models';
import {
  ActiveSleepSessionProvider,
  useActiveSleepSession,
} from '../src/session/ActiveSleepSessionProvider';

function session(overrides: Partial<SleepSession> = {}): SleepSession {
  return {
    id: 'active-1',
    tag: 'Sleep',
    startTime: 1_000,
    endTime: null,
    startTimeZone: 'America/Edmonton',
    endTimeZone: null,
    createdAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
  };
}

function SessionProbe() {
  const { activeSession, errorMessage, isHydrated, isMutating, toggle } = useActiveSleepSession();
  return (
    <View>
      <Text testID="active-id">{activeSession?.id ?? 'none'}</Text>
      <Text testID="error-message">{errorMessage ?? 'none'}</Text>
      <Text testID="session-state">{`${isHydrated}:${isMutating}`}</Text>
      <Pressable testID="toggle" onPress={() => void toggle()} />
    </View>
  );
}

describe('active sleep session provider', () => {
  it('restores the persisted active session and publishes its end immediately', async () => {
    let active: SleepSession | null = session();
    const repository: SleepToggleRepository = {
      create: jest.fn(),
      end: jest.fn(async (id, input) => {
        const ended = session({ endTime: input.endTime, endTimeZone: input.endTimeZone, id });
        active = null;
        return ended;
      }),
      getActive: jest.fn(async () => active),
    };
    const liveActivityService = { reconcile: jest.fn(async () => undefined) };

    await render(
      <ActiveSleepSessionProvider
        liveActivityService={liveActivityService}
        now={() => 301_000}
        repositoryFactory={async () => repository}
        timeZone={() => 'America/Edmonton'}
      >
        <SessionProbe />
      </ActiveSleepSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-id').props.children).toBe('active-1');
      expect(liveActivityService.reconcile).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'active-1' }),
      );
    });
    await fireEvent.press(screen.getByTestId('toggle'));
    await waitFor(() => {
      expect(screen.getByTestId('active-id').props.children).toBe('none');
      expect(screen.getByTestId('session-state').props.children).toBe('true:false');
      expect(liveActivityService.reconcile).toHaveBeenCalledWith(null);
    });
  });

  it('keeps a successful session start authoritative when Live Activity fails', async () => {
    const started = session({ id: 'started-1' });
    const repository: SleepToggleRepository = {
      create: jest.fn(async () => started),
      end: jest.fn(),
      getActive: jest.fn(async () => null),
    };
    const liveActivityService = {
      reconcile: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('ActivityKit unavailable')),
    };

    await render(
      <ActiveSleepSessionProvider
        liveActivityService={liveActivityService}
        now={() => 1_000}
        repositoryFactory={async () => repository}
        timeZone={() => 'America/Edmonton'}
      >
        <SessionProbe />
      </ActiveSleepSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('session-state').props.children).toBe('true:false');
    });
    await fireEvent.press(screen.getByTestId('toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('active-id').props.children).toBe('started-1');
      expect(screen.getByTestId('error-message').props.children).toBe(
        'Your sleep session is active, but Live Activity could not update.',
      );
      expect(screen.getByTestId('session-state').props.children).toBe('true:false');
    });
  });
});
