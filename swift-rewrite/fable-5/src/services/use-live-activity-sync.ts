// app-side live activity lifecycle: session start/end, relaunch restore,
// lock-screen button events (wake-up / start-sleep), wind-down window
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { addUserInteractionListener } from 'expo-widgets';

import { epochFromDayMinutes } from '../domain/editor';
import { addDays, zonedParts } from '../domain/session-rules';
import { appSleepStore, useSleepStore } from '../state/app-sleep-store';
import { useSettings } from '../state/settings-state';
import {
  endSleepActivity,
  endWindDownActivity,
  reconcileLiveActivity,
  startSleepActivity,
  startWindDownActivity,
} from './live-activity';
import { START_SLEEP_TARGET, WAKE_UP_TARGET } from '../../widgets/sleep-activity';

function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

// next bedtime instant; null when outside the 3-hour wind-down window
function windDownBedtime(optimalSleepMinutes: number, nowMs: number): number | null {
  const tz = deviceTimeZone();
  const p = zonedParts(nowMs, tz);
  const today = { year: p.year, month: p.month, day: p.day };
  let bedtime = epochFromDayMinutes(today, optimalSleepMinutes, tz);
  if (bedtime <= nowMs) {
    bedtime = epochFromDayMinutes(addDays(today, 1), optimalSleepMinutes, tz);
  }
  const msUntil = bedtime - nowMs;
  return msUntil > 0 && msUntil <= 3 * 3600_000 ? bedtime : null;
}

export function useLiveActivitySync() {
  const activeSession = useSleepStore((s) => s.activeSession);
  const liveActivityEnabled = useSettings((s) => s.liveActivityEnabled);
  const optimalSleepMinutes = useSettings((s) => s.optimalSleepMinutes);
  const previousSessionId = useRef<string | null>(null);
  const mounted = useRef(false);

  // lock-screen buttons -> session mutations (LiveActivityIntent -> js)
  useEffect(() => {
    const sub = addUserInteractionListener((event) => {
      const state = appSleepStore.getState();
      if (event.target === WAKE_UP_TARGET && state.activeSession) {
        const result = state.toggleSleep();
        endSleepActivity();
        if (result.joke && AppState.currentState === 'active') {
          Alert.alert('Pause...', result.joke);
        }
      } else if (event.target === START_SLEEP_TARGET && !state.activeSession) {
        const result = state.toggleSleep();
        if (result.started) {
          startSleepActivity(result.started);
        }
      }
    });
    return () => sub.remove();
  }, []);

  // wind-down window check on foreground
  const maybeStartWindDown = () => {
    const state = appSleepStore.getState();
    if (state.activeSession) return;
    const bedtime = windDownBedtime(optimalSleepMinutes, Date.now());
    if (bedtime != null) {
      startWindDownActivity(bedtime);
    } else {
      // outside the window: clear an expired countdown left on the lock screen
      endWindDownActivity();
    }
  };

  // session lifecycle -> activity lifecycle (+ initial reconcile on mount)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      previousSessionId.current = activeSession?.id ?? null;
      reconcileLiveActivity(activeSession);
      return;
    }
    const previous = previousSessionId.current;
    previousSessionId.current = activeSession?.id ?? null;
    if (activeSession && activeSession.id !== previous) {
      startSleepActivity(activeSession);
    } else if (!activeSession && previous) {
      endSleepActivity().then(() => {
        maybeStartWindDown();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id, liveActivityEnabled]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        const state = appSleepStore.getState();
        state.refresh();
        if (!state.activeSession) maybeStartWindDown();
      }
    });
    if (!activeSession) maybeStartWindDown();
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optimalSleepMinutes, liveActivityEnabled]);
}
