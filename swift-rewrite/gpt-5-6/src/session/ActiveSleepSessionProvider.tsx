import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';

import {
  toggleSleepSession,
  type SleepToggleRepository,
  type SleepToggleResult,
} from '@/components/dashboard/sleep-toggle';
import { getSessionRepository } from '@/data/session-repo';
import type { SleepSession } from '@/domain/models';

interface ActiveSleepSessionContextValue {
  activeSession: SleepSession | null;
  clearError(): void;
  errorMessage: string | null;
  isHydrated: boolean;
  isMutating: boolean;
  refresh(): Promise<void>;
  toggle(): Promise<SleepToggleResult>;
}

interface ActiveSleepSessionProviderProps extends PropsWithChildren {
  now?: () => number;
  repositoryFactory?: () => Promise<SleepToggleRepository>;
  timeZone?: () => string;
}

const ActiveSleepSessionContext = createContext<ActiveSleepSessionContextValue | null>(null);

const defaultNow = () => Date.now();
const defaultRepositoryFactory = () => getSessionRepository();
const defaultTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export function ActiveSleepSessionProvider({
  children,
  now = defaultNow,
  repositoryFactory = defaultRepositoryFactory,
  timeZone = defaultTimeZone,
}: ActiveSleepSessionProviderProps) {
  const [activeSession, setActiveSession] = useState<SleepSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const repository = await repositoryFactory();
      setActiveSession(await repository.getActive());
      setErrorMessage(null);
    } catch {
      setErrorMessage('Twilight could not restore your sleep session. Please try again.');
      throw new Error('Unable to restore active sleep session');
    } finally {
      setIsHydrated(true);
    }
  }, [repositoryFactory]);

  useEffect(() => {
    void Promise.resolve().then(refresh).catch(() => undefined);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const toggle = useCallback(async () => {
    setIsMutating(true);
    setErrorMessage(null);
    try {
      const repository = await repositoryFactory();
      const result = await toggleSleepSession(repository, {
        now: now(),
        timeZone: timeZone(),
      });
      setActiveSession(result.kind === 'started' ? result.session : null);
      return result;
    } catch {
      setErrorMessage('Twilight could not update your sleep session. Please try again.');
      throw new Error('Unable to toggle sleep session');
    } finally {
      setIsMutating(false);
    }
  }, [now, repositoryFactory, timeZone]);

  const clearError = useCallback(() => setErrorMessage(null), []);
  const value = useMemo(
    () => ({
      activeSession,
      clearError,
      errorMessage,
      isHydrated,
      isMutating,
      refresh,
      toggle,
    }),
    [activeSession, clearError, errorMessage, isHydrated, isMutating, refresh, toggle],
  );

  return (
    <ActiveSleepSessionContext.Provider value={value}>
      {children}
    </ActiveSleepSessionContext.Provider>
  );
}

export function useActiveSleepSession(): ActiveSleepSessionContextValue {
  const context = useContext(ActiveSleepSessionContext);
  if (!context) {
    throw new Error('useActiveSleepSession must be used within ActiveSleepSessionProvider');
  }
  return context;
}
