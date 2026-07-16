jest.mock('expo-sqlite/kv-store', () => ({ __esModule: true, default: {} }));

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import {
  OnboardingProvider,
  type OnboardingPersistence,
  useOnboarding,
} from '@/onboarding/OnboardingProvider';

class MemoryOnboardingPersistence implements OnboardingPersistence {
  isOnboarded: boolean;
  sleepMinutes: number;
  wakeMinutes: number;

  constructor({
    isOnboarded = false,
    sleepMinutes = 22 * 60,
    wakeMinutes = 7 * 60,
  }: Partial<{
    isOnboarded: boolean;
    sleepMinutes: number;
    wakeMinutes: number;
  }> = {}) {
    this.isOnboarded = isOnboarded;
    this.sleepMinutes = sleepMinutes;
    this.wakeMinutes = wakeMinutes;
  }

  async load() {
    return {
      isOnboarded: this.isOnboarded,
      sleepMinutes: this.sleepMinutes,
      wakeMinutes: this.wakeMinutes,
    };
  }

  async complete(schedule: { sleepMinutes: number; wakeMinutes: number }) {
    this.sleepMinutes = schedule.sleepMinutes;
    this.wakeMinutes = schedule.wakeMinutes;
    this.isOnboarded = true;
  }

  async restart() {
    this.isOnboarded = false;
  }
}

function OnboardingProbe() {
  const {
    completeOnboarding,
    draftSchedule,
    isHydrated,
    isOnboarded,
    restartOnboarding,
    setDraftSchedule,
  } = useOnboarding();
  return (
    <View>
      <Text testID="onboarding-state">{`${isHydrated}:${isOnboarded}`}</Text>
      <Text testID="onboarding-schedule">{`${draftSchedule.sleepMinutes}:${draftSchedule.wakeMinutes}`}</Text>
      <Pressable
        testID="change-schedule"
        onPress={() => setDraftSchedule({ sleepMinutes: 23 * 60 + 15, wakeMinutes: 8 * 60 })}
      />
      <Pressable testID="complete-onboarding" onPress={() => void completeOnboarding()} />
      <Pressable testID="restart-onboarding" onPress={() => void restartOnboarding()} />
    </View>
  );
}

describe('onboarding provider', () => {
  it('hydrates the gate and draft schedule from persisted settings', async () => {
    let resolveLoad: (state: {
      isOnboarded: boolean;
      sleepMinutes: number;
      wakeMinutes: number;
    }) => void = () => undefined;
    const pendingLoad = new Promise<{
      isOnboarded: boolean;
      sleepMinutes: number;
      wakeMinutes: number;
    }>((resolve) => {
      resolveLoad = resolve;
    });
    const persistence: OnboardingPersistence = {
      complete: async () => undefined,
      load: () => pendingLoad,
      restart: async () => undefined,
    };

    await render(
      <OnboardingProvider persistence={persistence}>
        <OnboardingProbe />
      </OnboardingProvider>,
    );

    expect(screen.getByTestId('onboarding-state').props.children).toBe('false:false');
    resolveLoad({
      isOnboarded: true,
      sleepMinutes: 21 * 60 + 30,
      wakeMinutes: 6 * 60 + 45,
    });
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-state').props.children).toBe('true:true');
      expect(screen.getByTestId('onboarding-schedule').props.children).toBe('1290:405');
    });
  });

  it('persists the draft schedule before opening the app gate', async () => {
    const persistence = new MemoryOnboardingPersistence();
    await render(
      <OnboardingProvider persistence={persistence}>
        <OnboardingProbe />
      </OnboardingProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-state').props.children).toBe('true:false');
    });

    await fireEvent.press(screen.getByTestId('change-schedule'));
    await fireEvent.press(screen.getByTestId('complete-onboarding'));

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-state').props.children).toBe('true:true');
      expect(persistence.sleepMinutes).toBe(23 * 60 + 15);
      expect(persistence.wakeMinutes).toBe(8 * 60);
    });
  });

  it('restarts onboarding without changing the saved schedule', async () => {
    const persistence = new MemoryOnboardingPersistence({
      isOnboarded: true,
      sleepMinutes: 20 * 60,
      wakeMinutes: 5 * 60 + 30,
    });
    await render(
      <OnboardingProvider persistence={persistence}>
        <OnboardingProbe />
      </OnboardingProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-state').props.children).toBe('true:true');
    });

    await fireEvent.press(screen.getByTestId('restart-onboarding'));

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-state').props.children).toBe('true:false');
      expect(persistence.sleepMinutes).toBe(20 * 60);
      expect(persistence.wakeMinutes).toBe(5 * 60 + 30);
    });
  });
});
