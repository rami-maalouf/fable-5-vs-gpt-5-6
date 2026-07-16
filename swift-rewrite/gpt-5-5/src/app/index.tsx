import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { TwilightPlaceholderScreen } from '@/components/twilight-placeholder-screen';

export default function HomeScreen() {
  const [LiveActivitySpikeControls, setLiveActivitySpikeControls] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (__DEV__) {
      void import('../../spikes/live-activity/LiveActivitySpikeControls').then((module) => {
        setLiveActivitySpikeControls(() => module.LiveActivitySpikeControls);
      });
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <TwilightPlaceholderScreen
        eyebrow="twilight"
        title="Dashboard"
        body="sleep session controls, last-night status, and the dashboard charts will land here."
      />
      {LiveActivitySpikeControls ? <LiveActivitySpikeControls /> : null}
    </View>
  );
}
