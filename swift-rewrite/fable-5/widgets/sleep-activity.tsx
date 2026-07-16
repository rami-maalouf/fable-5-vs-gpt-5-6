// ports: TwilightWidget/TwilightWidgetLiveActivity.swift
// live activity: "Rejuvenating..." progress toward sleep goal, elapsed/remaining,
// dynamic island states. superpower: interactive wake-up button (LiveActivityIntent).
import { Button, HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, padding, tint } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export interface SleepActivityProps {
  // epoch ms when the session started
  startTimeMs: number;
  // sleep goal length in seconds (default 8h in the original widget)
  goalSeconds: number;
}

export const WAKE_UP_TARGET = 'wake-up';

const SleepActivity = (props: SleepActivityProps, _env: LiveActivityEnvironment) => {
  'widget';
  // note: module-scope constants are not captured by the 'widget' directive
  // compiler - everything the layout needs must live inside this function
  const TEAL = '#00d4ff';
  const WAKE = 'wake-up';
  const start = new Date(props.startTimeMs);
  const goalEnd = new Date(props.startTimeMs + Math.max(props.goalSeconds, 1) * 1000);
  const progressRange = { lower: start, upper: goalEnd };

  const titleRow = (
    <HStack spacing={4}>
      <Image systemName="moon.fill" color={TEAL} />
      <Text modifiers={[font({ size: 15, weight: 'semibold' })]}>Rejuvenating...</Text>
    </HStack>
  );

  const elapsedTimer = (
    <Text
      date={start}
      dateStyle="timer"
      modifiers={[font({ size: 28, weight: 'semibold', design: 'rounded' })]}
    />
  );

  return {
    banner: (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ horizontal: 16, vertical: 12 })]}>
        <HStack spacing={12}>
          {titleRow}
          <Spacer />
          {elapsedTimer}
        </HStack>
        <ProgressView timerInterval={progressRange} countsDown={false} modifiers={[tint(TEAL)]} />
        <HStack spacing={4}>
          <Text timerInterval={progressRange} modifiers={[font({ size: 12, weight: 'semibold' })]} />
          <Text modifiers={[font({ size: 12 }), foregroundStyle('#8b9dc3')]}>left</Text>
          <Spacer />
          <Button label="Wake Up" systemImage="sun.max.fill" target={WAKE} />
        </HStack>
      </VStack>
    ),
    compactLeading: <Image systemName="moon.fill" color={TEAL} />,
    compactTrailing: (
      <Text
        date={start}
        dateStyle="timer"
        modifiers={[font({ size: 11, weight: 'semibold' }), frame({ width: 44 })]}
      />
    ),
    minimal: <Image systemName="moon.fill" color={TEAL} />,
    expandedCenter: (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ horizontal: 16, vertical: 4 })]}>
        <HStack spacing={10}>
          {titleRow}
          <Spacer />
          <Text
            date={start}
            dateStyle="timer"
            modifiers={[font({ size: 22, weight: 'semibold', design: 'rounded' })]}
          />
        </HStack>
        <ProgressView timerInterval={progressRange} countsDown={false} modifiers={[tint(TEAL)]} />
      </VStack>
    ),
    expandedBottom: (
      <HStack modifiers={[padding({ horizontal: 16, vertical: 4 })]}>
        <Button label="Wake Up" systemImage="sun.max.fill" target={WAKE} />
      </HStack>
    ),
  };
};

export default createLiveActivity('SleepActivity', SleepActivity);
