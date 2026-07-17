// ports: TwilightWidget/TwilightWidgetLiveActivity.swift
// parity: "Rejuvenating..." + elapsed timer + progress toward the sleep goal +
// remaining countdown, dynamic island compact/minimal/expanded states.
// superpower: interactive wake-up button (LiveActivityIntent -> js) and a
// wind-down countdown state before bedtime with a start-sleep button.
import { Button, HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, padding, tint } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export interface SleepActivityProps {
  // 'sleep' = active session; 'winddown' = countdown to bedtime
  mode: 'sleep' | 'winddown';
  // sleep mode: epoch ms when the session started
  startTimeMs: number;
  // sleep mode: sleep goal length in seconds
  goalSeconds: number;
  // winddown mode: epoch ms of the upcoming bedtime
  bedtimeMs: number;
}

// button targets are the literal strings 'wake-up' / 'start-sleep' below;
// js-side constants live in src/services/live-activity-targets.ts so android
// never has to evaluate this module (createLiveActivity is ios-only)

const SleepActivity = (props: SleepActivityProps, _env: LiveActivityEnvironment) => {
  'widget';
  // note: the 'widget' compiler captures only this function body - constants inline
  const TEAL = '#00d4ff';
  const GOLD = '#ffd700';
  const SECONDARY = '#8b9dc3';

  if (props.mode === 'winddown') {
    const bedtime = new Date(props.bedtimeMs);
    const countdown = { lower: new Date(), upper: bedtime };
    return {
      banner: (
        <VStack alignment="leading" spacing={8} modifiers={[padding({ horizontal: 16, vertical: 12 })]}>
          <HStack spacing={12}>
            <HStack spacing={4}>
              <Image systemName="moon.zzz.fill" color={GOLD} />
              <Text modifiers={[font({ size: 15, weight: 'semibold' })]}>Winding down...</Text>
            </HStack>
            <Spacer />
            <Text
              timerInterval={countdown}
              countsDown
              modifiers={[font({ size: 28, weight: 'semibold', design: 'rounded' })]}
            />
          </HStack>
          <HStack spacing={4}>
            <Text modifiers={[font({ size: 12 }), foregroundStyle(SECONDARY)]}>
              until bedtime - dim the lights
            </Text>
            <Spacer />
            <Button label="Start Sleep" systemImage="moon.fill" target="start-sleep" />
          </HStack>
        </VStack>
      ),
      compactLeading: <Image systemName="moon.zzz.fill" color={GOLD} />,
      compactTrailing: (
        <Text
          timerInterval={countdown}
          countsDown
          modifiers={[font({ size: 11, weight: 'semibold' }), frame({ width: 44 })]}
        />
      ),
      minimal: <Image systemName="moon.zzz.fill" color={GOLD} />,
      expandedCenter: (
        <VStack alignment="leading" spacing={6} modifiers={[padding({ horizontal: 16, vertical: 4 })]}>
          <HStack spacing={10}>
            <HStack spacing={4}>
              <Image systemName="moon.zzz.fill" color={GOLD} />
              <Text modifiers={[font({ size: 15, weight: 'semibold' })]}>Winding down...</Text>
            </HStack>
            <Spacer />
            <Text
              timerInterval={countdown}
              countsDown
              modifiers={[font({ size: 22, weight: 'semibold', design: 'rounded' })]}
            />
          </HStack>
        </VStack>
      ),
      expandedBottom: (
        <HStack modifiers={[padding({ horizontal: 16, vertical: 4 })]}>
          <Button label="Start Sleep" systemImage="moon.fill" target="start-sleep" />
        </HStack>
      ),
    };
  }

  const start = new Date(props.startTimeMs);
  const goalEnd = new Date(props.startTimeMs + Math.max(props.goalSeconds, 1) * 1000);
  const progressRange = { lower: start, upper: goalEnd };

  return {
    banner: (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ horizontal: 16, vertical: 12 })]}>
        <HStack spacing={12}>
          <HStack spacing={4}>
            <Image systemName="moon.fill" color={TEAL} />
            <Text modifiers={[font({ size: 15, weight: 'semibold' })]}>Rejuvenating...</Text>
          </HStack>
          <Spacer />
          <Text
            date={start}
            dateStyle="timer"
            modifiers={[font({ size: 28, weight: 'semibold', design: 'rounded' })]}
          />
        </HStack>
        <ProgressView timerInterval={progressRange} countsDown={false} modifiers={[tint(TEAL)]} />
        <HStack spacing={4}>
          <Text timerInterval={progressRange} modifiers={[font({ size: 12, weight: 'semibold' })]} />
          <Text modifiers={[font({ size: 12 }), foregroundStyle(SECONDARY)]}>left</Text>
          <Spacer />
          <Button label="Wake Up" systemImage="sun.max.fill" target="wake-up" />
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
          <HStack spacing={4}>
            <Image systemName="moon.fill" color={TEAL} />
            <Text modifiers={[font({ size: 15, weight: 'semibold' })]}>Rejuvenating...</Text>
          </HStack>
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
        <Button label="Wake Up" systemImage="sun.max.fill" target="wake-up" />
      </HStack>
    ),
  };
};

export default createLiveActivity('SleepActivity', SleepActivity);
