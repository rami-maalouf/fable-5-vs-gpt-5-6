import { Button, HStack, Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

import { SLEEP_ACTIVITY_SOURCE } from './interaction';

export interface SleepActivityProps {
  elapsedLabel: string;
  startedAt: number;
  status: string;
}

function SleepActivity(
  props: SleepActivityProps,
  environment: LiveActivityEnvironment,
) {
  'widget';

  const accent = environment.isLuminanceReduced ? '#8b9dc3' : '#00d4ff';
  const moon = <Image systemName="moon.stars.fill" color={accent} />;
  const elapsed = (
    <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(accent)]}>
      {props.elapsedLabel}
    </Text>
  );

  return {
    banner: (
      <VStack modifiers={[padding({ all: 16 })]} spacing={8}>
        <HStack spacing={8}>
          {moon}
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ size: 17, weight: 'bold' })]}>Twilight</Text>
            <Text>{props.status}</Text>
          </VStack>
          <Text> </Text>
          {elapsed}
        </HStack>
        <Button
          label="Wake up"
          onPress={() => undefined}
          systemImage="sun.max.fill"
          target="wake-up"
        />
      </VStack>
    ),
    compactLeading: moon,
    compactTrailing: elapsed,
    minimal: moon,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 8 })]}>
        {moon}
        <Text>Twilight</Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 8 })]}>
        {elapsed}
        <Text>asleep</Text>
      </VStack>
    ),
    expandedBottom: (
      <Button
        label="Wake up"
        onPress={() => undefined}
        systemImage="sun.max.fill"
        target="wake-up"
      />
    ),
  };
}

export const SleepLiveActivity = createLiveActivity<SleepActivityProps>(
  SLEEP_ACTIVITY_SOURCE,
  SleepActivity,
);
