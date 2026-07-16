import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';

import { TwilightPlaceholderScreen } from '@/components/twilight-placeholder-screen';

export default function SettingsScreen() {
  const [GrayscaleWhileAsleepSpikeDemo, setGrayscaleWhileAsleepSpikeDemo] =
    useState<ComponentType | null>(null);

  useEffect(() => {
    if (__DEV__) {
      void import('../../spikes/grayscale-while-asleep/GrayscaleWhileAsleepSpikeDemo').then(
        (module) => {
          setGrayscaleWhileAsleepSpikeDemo(() => module.GrayscaleWhileAsleepSpikeDemo);
        },
      );
    }
  }, []);

  return (
    <TwilightPlaceholderScreen
      eyebrow="preferences"
      title="Settings"
      body="sleep goals, appearance, notifications, and community links will land here.">
      {GrayscaleWhileAsleepSpikeDemo ? <GrayscaleWhileAsleepSpikeDemo /> : null}
    </TwilightPlaceholderScreen>
  );
}
