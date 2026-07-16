import { View } from 'react-native';

import { TwilightPlaceholderScreen } from '@/components/twilight-placeholder-screen';

import { LiveActivitySpikeControls } from '../../spikes/live-activity/LiveActivitySpikeControls';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TwilightPlaceholderScreen
        eyebrow="twilight"
        title="Dashboard"
        body="sleep session controls, last-night status, and the dashboard charts will land here."
      />
      {__DEV__ ? <LiveActivitySpikeControls /> : null}
    </View>
  );
}
