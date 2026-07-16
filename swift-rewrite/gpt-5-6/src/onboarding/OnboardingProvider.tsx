// ports: twilight/views/sleeponboardingview.swift

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { settingsStore } from '@/data/settings-store';

export interface OnboardingSchedule {
  sleepMinutes: number;
  wakeMinutes: number;
}

interface PersistedOnboardingState extends OnboardingSchedule {
  isOnboarded: boolean;
}

export interface OnboardingPersistence {
  complete(schedule: OnboardingSchedule): Promise<void>;
  load(): Promise<PersistedOnboardingState>;
  restart(): Promise<void>;
}

interface OnboardingContextValue {
  completeOnboarding(): Promise<void>;
  draftSchedule: OnboardingSchedule;
  isHydrated: boolean;
  isOnboarded: boolean;
  restartOnboarding(): Promise<void>;
  setDraftSchedule(schedule: OnboardingSchedule): void;
}

const defaultSchedule: OnboardingSchedule = {
  sleepMinutes: 22 * 60,
  wakeMinutes: 7 * 60,
};

const defaultPersistence: OnboardingPersistence = {
  async complete(schedule) {
    await Promise.all([
      settingsStore.set('optimalSleepMinutes', schedule.sleepMinutes),
      settingsStore.set('optimalWakeMinutes', schedule.wakeMinutes),
    ]);
    await settingsStore.set('isOnboarded', true);
  },
  async load() {
    const [isOnboarded, sleepMinutes, wakeMinutes] = await Promise.all([
      settingsStore.get('isOnboarded'),
      settingsStore.get('optimalSleepMinutes'),
      settingsStore.get('optimalWakeMinutes'),
    ]);
    return { isOnboarded, sleepMinutes, wakeMinutes };
  },
  restart: () => settingsStore.set('isOnboarded', false),
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
  persistence = defaultPersistence,
}: PropsWithChildren<{ persistence?: OnboardingPersistence }>) {
  const [draftSchedule, setDraftSchedule] = useState(defaultSchedule);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    persistence
      .load()
      .then((persisted) => {
        if (!isCurrent) {
          return;
        }
        setDraftSchedule({
          sleepMinutes: persisted.sleepMinutes,
          wakeMinutes: persisted.wakeMinutes,
        });
        setIsOnboarded(persisted.isOnboarded);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isCurrent) {
          setIsHydrated(true);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [persistence]);

  const completeOnboarding = useCallback(async () => {
    await persistence.complete(draftSchedule);
    setIsOnboarded(true);
  }, [draftSchedule, persistence]);

  const restartOnboarding = useCallback(async () => {
    await persistence.restart();
    setIsOnboarded(false);
  }, [persistence]);

  const value = useMemo(
    () => ({
      completeOnboarding,
      draftSchedule,
      isHydrated,
      isOnboarded,
      restartOnboarding,
      setDraftSchedule,
    }),
    [completeOnboarding, draftSchedule, isHydrated, isOnboarded, restartOnboarding],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
