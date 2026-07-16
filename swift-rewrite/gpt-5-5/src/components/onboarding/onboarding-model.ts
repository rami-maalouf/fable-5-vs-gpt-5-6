import type { SleepSettings } from '@/domain/models';

export type OnboardingStep = 'welcome' | 'schedule' | 'notifications' | 'finish';

export const onboardingSteps: OnboardingStep[] = ['welcome', 'schedule', 'notifications', 'finish'];

function stepIndex(step: OnboardingStep) {
  return onboardingSteps.indexOf(step);
}

export function nextOnboardingStep(step: OnboardingStep): OnboardingStep {
  return onboardingSteps[Math.min(stepIndex(step) + 1, onboardingSteps.length - 1)];
}

export function previousOnboardingStep(step: OnboardingStep): OnboardingStep {
  return onboardingSteps[Math.max(stepIndex(step) - 1, 0)];
}

export function getOnboardingProgressLabel(step: OnboardingStep) {
  return `step ${stepIndex(step) + 1} of ${onboardingSteps.length}`;
}

export function completeOnboardingSettings(
  settings: SleepSettings,
  {
    sleepMinutes,
    wakeMinutes,
  }: {
    sleepMinutes: number;
    wakeMinutes: number;
  },
): SleepSettings {
  return {
    ...settings,
    isOnboarded: true,
    optimalSleepMinutes: sleepMinutes,
    optimalWakeMinutes: wakeMinutes,
  };
}
