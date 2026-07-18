import { Gauge, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  minimumScaleFactor,
  monospacedDigit,
  scaleEffect,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type RemainingCaloriesWidgetProps = {
  // display-ready whole number of calories left today
  remaining: number;
  // consumed progress toward the daily calorie goal, clamped 0..1
  progress: number;
};

const RemainingCaloriesWidgetComponent = (
  props: RemainingCaloriesWidgetProps,
  environment: WidgetEnvironment,
) => {
  'widget';
  // literal colors mirror src/theme/tokens.ts light/dark tokens: the widget
  // bundle cannot import react-native hook helpers, so keep these in sync.
  // in tinted (accented) rendering ios recolors all content automatically.
  const isDark = environment.colorScheme === 'dark';
  const textPrimary = isDark ? '#F5EFE9' : '#2A2118';
  const textSecondary = isDark ? '#A6998A' : '#8B7F71';
  const accent = isDark ? '#F0765C' : '#E8654A';

  return (
    <VStack alignment="leading" spacing={0}>
      <HStack alignment="center" spacing={0}>
        <Text
          modifiers={[
            font({ weight: 'semibold', size: 14 }),
            foregroundStyle(accent),
          ]}
        >
          Nourish
        </Text>
        <Spacer />
        <Gauge
          value={props.progress}
          modifiers={[
            gaugeStyle('circularCapacity'),
            tint(accent),
            scaleEffect(0.6),
            frame({ width: 32, height: 32 }),
          ]}
        />
      </HStack>
      <Spacer />
      <Text
        modifiers={[
          font({ weight: 'bold', size: 42 }),
          monospacedDigit(),
          minimumScaleFactor(0.6),
          foregroundStyle(textPrimary),
        ]}
      >
        {String(props.remaining)}
      </Text>
      <Text
        modifiers={[
          font({ weight: 'regular', size: 12 }),
          foregroundStyle(textSecondary),
        ]}
      >
        calories left
      </Text>
    </VStack>
  );
};

export default createWidget(
  'RemainingCaloriesWidget',
  RemainingCaloriesWidgetComponent,
);
