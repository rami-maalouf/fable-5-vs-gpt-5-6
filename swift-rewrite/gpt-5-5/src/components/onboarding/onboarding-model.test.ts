import { defaultSleepSettings } from '@/domain/models';

import {
  completeOnboardingSettings,
  getOnboardingProgressLabel,
  nextOnboardingStep,
  previousOnboardingStep,
} from './onboarding-model';

describe('onboarding model', () => {
  it('moves through the four scoped onboarding steps', () => {
    expect(nextOnboardingStep('welcome')).toBe('schedule');
    expect(nextOnboardingStep('schedule')).toBe('notifications');
    expect(nextOnboardingStep('notifications')).toBe('finish');
    expect(nextOnboardingStep('finish')).toBe('finish');
    expect(previousOnboardingStep('finish')).toBe('notifications');
    expect(previousOnboardingStep('welcome')).toBe('welcome');
  });

  it('formats progress labels for each onboarding step', () => {
    expect(getOnboardingProgressLabel('welcome')).toBe('step 1 of 4');
    expect(getOnboardingProgressLabel('finish')).toBe('step 4 of 4');
  });

  it('completes onboarding without changing unrelated settings', () => {
    expect(
      completeOnboardingSettings(defaultSleepSettings, {
        sleepMinutes: 23 * 60,
        wakeMinutes: 6 * 60 + 30,
      }),
    ).toEqual({
      ...defaultSleepSettings,
      isOnboarded: true,
      optimalSleepMinutes: 23 * 60,
      optimalWakeMinutes: 6 * 60 + 30,
    });
  });
});
