// ports: Utils/LiveActivityManager.swift (sleep-relevant behavior)
// starts the activity with the session, ends it on wake, restores after
// relaunch via getInstances(), respects the settings toggle. adds the
// superpower wind-down countdown state.
import { settingsStore } from '../data/app-db';
import type { SleepSession } from '../domain/models';
import { sleepGoalSeconds } from '../domain/session-rules';
import SleepActivity, { type SleepActivityProps } from '../../widgets/sleep-activity';

function isEnabled(): boolean {
  return settingsStore.get('liveActivityEnabled');
}

function instances() {
  try {
    return SleepActivity.getInstances();
  } catch {
    return [];
  }
}

async function endAll(): Promise<void> {
  for (const instance of instances()) {
    try {
      await instance.end('immediate');
    } catch {
      // already gone
    }
  }
  settingsStore.set('liveActivityId', null);
}

function sleepProps(session: SleepSession): SleepActivityProps {
  const goalSeconds = sleepGoalSeconds(
    settingsStore.get('optimalSleepMinutes'),
    settingsStore.get('optimalWakeMinutes')
  );
  return { mode: 'sleep', startTimeMs: session.startTime, goalSeconds, bedtimeMs: 0 };
}

export async function startSleepActivity(session: SleepSession): Promise<void> {
  if (!isEnabled()) return;
  await endAll();
  try {
    const instance = SleepActivity.start(sleepProps(session), 'twilight://');
    settingsStore.set('liveActivityId', instance ? 'sleep' : null);
  } catch {
    // live activities unavailable (permission off / unsupported device)
  }
}

export async function endSleepActivity(): Promise<void> {
  await endAll();
}

// superpower: wind-down countdown on the lock screen before bedtime.
// the stored id encodes the bedtime so a changed bedtime replaces the
// countdown while an unchanged one is left alone on every foreground.
export async function startWindDownActivity(bedtimeMs: number): Promise<void> {
  if (!isEnabled()) return;
  const id = `winddown:${bedtimeMs}`;
  if (settingsStore.get('liveActivityId') === id && instances().length > 0) return;
  await endAll();
  try {
    const instance = SleepActivity.start(
      { mode: 'winddown', startTimeMs: 0, goalSeconds: 0, bedtimeMs },
      'twilight://'
    );
    settingsStore.set('liveActivityId', instance ? id : null);
  } catch {
    // unavailable
  }
}

// clears an expired wind-down countdown (bedtime passed with no session started)
export async function endWindDownActivity(): Promise<void> {
  if (settingsStore.get('liveActivityId')?.startsWith('winddown')) {
    await endAll();
  }
}

// relaunch reconciliation: active session -> ensure a sleep activity exists;
// no session -> clear stale activities (ports the restore-on-relaunch flow)
export async function reconcileLiveActivity(activeSession: SleepSession | null): Promise<void> {
  if (!isEnabled()) {
    await endAll();
    return;
  }
  const existing = instances();
  if (activeSession) {
    if (existing.length === 0 || settingsStore.get('liveActivityId') !== 'sleep') {
      await startSleepActivity(activeSession);
    }
  } else if (existing.length > 0 && settingsStore.get('liveActivityId') === 'sleep') {
    await endAll();
  }
}
