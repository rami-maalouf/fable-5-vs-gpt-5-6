import { TwilightPlaceholderScreen } from '@/components/twilight-placeholder-screen';

import { GrayscaleWhileAsleepSpikeDemo } from '../../spikes/grayscale-while-asleep/GrayscaleWhileAsleepSpikeDemo';

export default function SettingsScreen() {
  return (
    <TwilightPlaceholderScreen
      eyebrow="preferences"
      title="Settings"
      body="sleep goals, appearance, notifications, and community links will land here.">
      {__DEV__ ? <GrayscaleWhileAsleepSpikeDemo /> : null}
    </TwilightPlaceholderScreen>
  );
}
