// app-level sleep store singleton + react hook. kept apart from the factory in
// sleep-store.ts so tests can build stores over an in-memory repo without
// touching the native sqlite module.
import { useStore } from 'zustand';

import { sessionRepo } from '../data/app-db';
import { createSleepStore, type SleepState } from './sleep-store';

export const appSleepStore = createSleepStore(sessionRepo);

export function useSleepStore<T>(selector: (state: SleepState) => T): T {
  return useStore(appSleepStore, selector);
}
