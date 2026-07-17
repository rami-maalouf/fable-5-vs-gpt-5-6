import { Platform } from 'react-native';
import {
  addUserInteractionListener,
  type LiveActivity,
  type UserInteractionEvent,
} from 'expo-widgets';

import TwilightLiveActivity from '../../widgets/TwilightLiveActivity';
import {
  createLiveActivitySpikeProps,
  createWindDownSpikeProps,
  liveActivityWakeTarget,
  type TwilightLiveActivitySpikeProps,
} from '../../spikes/live-activity/live-activity-spike-state';
import { createEndedLiveActivityProps } from './live-activity-state';

let startedAt = new Date();
let activeInstance: LiveActivity<TwilightLiveActivitySpikeProps> | null = null;

function assertIosLiveActivity() {
  if (Platform.OS !== 'ios') {
    throw new Error('expo-widgets live activities are only available on ios');
  }
}

function getInstance() {
  const existing = activeInstance ?? TwilightLiveActivity.getInstances()[0] ?? null;
  activeInstance = existing;
  return existing;
}

export function startLiveActivitySpike(now = new Date()) {
  assertIosLiveActivity();
  startedAt = now;
  const props = createLiveActivitySpikeProps(now, startedAt, 8 * 60);
  activeInstance = TwilightLiveActivity.start(props, 'twilight://live-activity-spike');
  return props;
}

export async function updateLiveActivitySpike(now = new Date()) {
  assertIosLiveActivity();
  const instance = getInstance();

  if (!instance) {
    throw new Error('no live activity spike is active');
  }

  const props = createLiveActivitySpikeProps(now, startedAt, 8 * 60);
  await instance.update(props);
  return props;
}

export async function startWindDownLiveActivitySpike(minutesUntilBed = 180) {
  assertIosLiveActivity();
  const props = createWindDownSpikeProps(minutesUntilBed);
  activeInstance = TwilightLiveActivity.start(props, 'twilight://live-activity-spike');
  return props;
}

export async function endLiveActivitySpike(now = new Date()) {
  assertIosLiveActivity();
  const instances = [...TwilightLiveActivity.getInstances()];

  if (activeInstance && !instances.includes(activeInstance)) {
    instances.push(activeInstance);
  }

  await Promise.all(
    instances.map((instance) =>
      instance.end(
        'immediate',
        createEndedLiveActivityProps(now),
        now,
      ),
    ),
  );
  activeInstance = null;
}

export function addLiveActivitySpikeInteractionListener(
  onEvent: (event: UserInteractionEvent) => void,
) {
  return addUserInteractionListener((event) => {
    onEvent(event);

    if (event.target === liveActivityWakeTarget) {
      void endLiveActivitySpike(new Date());
    }
  });
}
