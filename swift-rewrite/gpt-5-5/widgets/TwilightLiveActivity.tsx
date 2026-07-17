import { Button, HStack, Image, ProgressView, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

import {
  twilightLiveActivityName,
  type TwilightLiveActivityProps,
} from '../src/services/live-activity-state';

function TwilightLiveActivity(
  props: TwilightLiveActivityProps,
  environment: LiveActivityEnvironment,
) {
  'widget';
  const elapsedHours = Math.floor(props.elapsedMinutes / 60);
  const elapsedRemainder = props.elapsedMinutes % 60;
  const remainingHours = Math.floor(props.remainingMinutes / 60);
  const remainingRemainder = props.remainingMinutes % 60;
  const elapsedText =
    elapsedHours === 0 ? `${elapsedRemainder}m` : `${elapsedHours}h ${elapsedRemainder}m`;
  const remainingText =
    remainingHours === 0 ? `${remainingRemainder}m` : `${remainingHours}h ${remainingRemainder}m`;
  const accent = environment.colorScheme === 'dark' ? '#00d4ff' : '#0a1520';
  const secondary = environment.colorScheme === 'dark' ? '#8b9dc3' : '#5c4b5e';
  const background = environment.colorScheme === 'dark' ? '#0a1520' : '#ff9966';
  const wakeTarget = 'wake-up';

  const status =
    props.phase === 'windDown'
      ? `${remainingText} until bedtime`
      : `${elapsedText} asleep · ${remainingText} left`;

  return {
    banner: (
      <VStack
        spacing={10}
        modifiers={[padding({ all: 16 }), activityBackgroundTint(background)]}>
        <HStack spacing={10} alignment="center">
          <Image systemName="moon.stars.fill" color={accent} size={24} />
          <VStack spacing={4} alignment="leading">
            <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle('#ffffff')]}>
              {props.title}
            </Text>
            <Text modifiers={[font({ size: 13 }), foregroundStyle(secondary)]}>{status}</Text>
          </VStack>
        </HStack>
        <ProgressView value={props.progress} modifiers={[tint(accent)]} />
        <Button
          label="Wake Up"
          systemImage="sunrise.fill"
          target={wakeTarget}
          modifiers={[buttonStyle('borderedProminent'), controlSize('small'), tint(accent)]}
        />
      </VStack>
    ),
    compactLeading: <Image systemName="moon.stars.fill" color={accent} />,
    compactTrailing: <Text modifiers={[foregroundStyle(accent)]}>{elapsedText}</Text>,
    minimal: <Image systemName="moon.stars.fill" color={accent} />,
    expandedLeading: (
      <VStack spacing={4} modifiers={[padding({ all: 10 })]}>
        <Image systemName="moon.stars.fill" color={accent} />
        <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>twilight</Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack spacing={4} modifiers={[padding({ all: 10 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 20 }), foregroundStyle(accent)]}>
          {remainingText}
        </Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>left</Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack spacing={8} modifiers={[padding({ all: 12 })]}>
        <ProgressView value={props.progress} modifiers={[tint(accent)]} />
        <Button
          label="Wake Up"
          target={wakeTarget}
          modifiers={[buttonStyle('borderedProminent'), controlSize('regular'), tint(accent)]}
        />
      </VStack>
    ),
  };
}

export default createLiveActivity<TwilightLiveActivityProps>(
  twilightLiveActivityName,
  TwilightLiveActivity,
);
