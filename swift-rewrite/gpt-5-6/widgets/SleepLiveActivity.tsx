import { HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type SleepActivityPhase = 'ended' | 'sleeping' | 'windDown';

export interface SleepActivityProps {
  goalEndAt: number;
  phase: SleepActivityPhase;
  sessionId: string;
  startedAt: number;
  status: string;
  title: string;
}

function SleepActivity(
  props: SleepActivityProps,
  environment: LiveActivityEnvironment,
) {
  'widget';

  const accent = environment.isLuminanceReduced ? '#8b9dc3' : '#00d4ff';
  const secondary = environment.colorScheme === 'dark' ? '#a9b7c6' : '#53677a';
  const startedAt = new Date(props.startedAt);
  const goalEndAt = new Date(Math.max(props.startedAt + 1, props.goalEndAt));
  const timerInterval = { lower: startedAt, upper: goalEndAt };
  const moon = (
    <Image
      color={accent}
      modifiers={[accessibilityLabel('Twilight sleep session')]}
      size={22}
      systemName="moon.stars.fill"
    />
  );
  const elapsed = (
    <Text
      countsDown={false}
      modifiers={[
        font({ design: 'rounded', size: 16, weight: 'bold' }),
        foregroundStyle(accent),
        monospacedDigit(),
        lineLimit(1),
      ]}
      timerInterval={timerInterval}
    />
  );
  const remaining = (
    <Text
      countsDown
      modifiers={[
        font({ design: 'rounded', size: 13, weight: 'semibold' }),
        foregroundStyle(secondary),
        monospacedDigit(),
        lineLimit(1),
      ]}
      timerInterval={timerInterval}
    />
  );

  return {
    banner: (
      <VStack modifiers={[padding({ all: 16 })]} spacing={11}>
        <HStack alignment="center" spacing={10}>
          {moon}
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ size: 17, weight: 'bold' }), lineLimit(1)]}>
              {props.title}
            </Text>
            <Text
              modifiers={[
                font({ size: 13, weight: 'medium' }),
                foregroundStyle(secondary),
                lineLimit(1),
              ]}
            >
              {props.status}
            </Text>
          </VStack>
          <Spacer />
          <VStack alignment="trailing" spacing={1}>
            {elapsed}
            <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundStyle(secondary)]}>
              elapsed
            </Text>
          </VStack>
        </HStack>
        <ProgressView
          countsDown={false}
          modifiers={[tint(accent), accessibilityLabel('Sleep goal progress')]}
          timerInterval={timerInterval}
        />
        <HStack spacing={5}>
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(secondary)]}>
            Goal remaining
          </Text>
          <Spacer />
          {remaining}
        </HStack>
      </VStack>
    ),
    bannerSmall: (
      <HStack modifiers={[padding({ all: 12 })]} spacing={8}>
        {moon}
        <Text modifiers={[font({ size: 14, weight: 'bold' }), lineLimit(1)]}>{props.title}</Text>
        <Spacer />
        {elapsed}
      </HStack>
    ),
    compactLeading: moon,
    compactTrailing: elapsed,
    minimal: moon,
    expandedCenter: (
      <Text modifiers={[font({ size: 15, weight: 'bold' }), lineLimit(1)]}>{props.title}</Text>
    ),
    expandedLeading: (
      <VStack alignment="leading" modifiers={[padding({ all: 8 })]} spacing={3}>
        {moon}
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(secondary)]}>
          Twilight
        </Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack alignment="trailing" modifiers={[padding({ all: 8 })]} spacing={2}>
        {elapsed}
        <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundStyle(secondary)]}>
          asleep
        </Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[frame({ maxWidth: 320 }), padding({ horizontal: 12, vertical: 8 })]} spacing={7}>
        <ProgressView countsDown={false} modifiers={[tint(accent)]} timerInterval={timerInterval} />
        <HStack spacing={5}>
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(secondary)]}>
            Until sleep goal
          </Text>
          <Spacer />
          {remaining}
        </HStack>
      </VStack>
    ),
  };
}

export const SleepLiveActivity = createLiveActivity<SleepActivityProps>(
  'SleepSessionActivity',
  SleepActivity,
);
