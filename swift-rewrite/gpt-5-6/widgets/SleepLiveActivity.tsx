import { HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
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
  const isWindDown = props.phase === 'windDown';
  const startedAt = new Date(props.startedAt);
  const goalEndAt = new Date(Math.max(props.startedAt + 1, props.goalEndAt));
  const timerInterval = { lower: startedAt, upper: goalEndAt };
  const moon = (
    <Image
      color={accent}
      modifiers={[accessibilityLabel(isWindDown ? 'Twilight wind-down' : 'Twilight sleep session')]}
      size={22}
      systemName={isWindDown ? 'moon.zzz.fill' : 'moon.stars.fill'}
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
  const primaryTimer = isWindDown ? remaining : elapsed;
  const primaryTimerLabel = isWindDown ? 'until bed' : 'elapsed';
  const progressLabel = isWindDown ? 'Wind-down progress' : 'Sleep goal progress';

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
            {primaryTimer}
            <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundStyle(secondary)]}>
              {primaryTimerLabel}
            </Text>
          </VStack>
        </HStack>
        <ProgressView
          countsDown={false}
          modifiers={[tint(accent), labelsHidden(), accessibilityLabel(progressLabel)]}
          timerInterval={timerInterval}
        />
        <HStack spacing={5}>
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(secondary)]}>
            {isWindDown ? 'Slow down gently' : 'Goal remaining'}
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
        {primaryTimer}
      </HStack>
    ),
    compactLeading: moon,
    compactTrailing: primaryTimer,
    minimal: moon,
    expandedCenter: (
      <VStack alignment="center" spacing={2}>
        <Text modifiers={[font({ size: 15, weight: 'bold' }), lineLimit(1)]}>{props.title}</Text>
        <Text
          modifiers={[
            font({ size: 11, weight: 'medium' }),
            foregroundStyle(secondary),
            lineLimit(1),
          ]}
        >
          {props.status}
        </Text>
      </VStack>
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
        {primaryTimer}
        <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundStyle(secondary)]}>
          {isWindDown ? 'until bed' : 'asleep'}
        </Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[frame({ maxWidth: 320 }), padding({ horizontal: 12, vertical: 8 })]} spacing={7}>
        <ProgressView
          countsDown={false}
          modifiers={[tint(accent), labelsHidden()]}
          timerInterval={timerInterval}
        />
        <HStack spacing={5}>
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(secondary)]}>
            {isWindDown ? 'Dim the lights. Let tomorrow begin gently.' : 'Until sleep goal'}
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
