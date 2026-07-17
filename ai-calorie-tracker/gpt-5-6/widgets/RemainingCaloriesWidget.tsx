import { Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type RemainingCaloriesWidgetProps = {
  caloriesRemaining: number;
};

const RemainingCalories = (
  props: RemainingCaloriesWidgetProps,
  environment: WidgetEnvironment,
) => {
  'widget';

  const isDark = environment.colorScheme === 'dark';
  const backgroundColor = isDark ? '#211916' : '#FFF7F2';
  const primaryColor = isDark ? '#FFF8F4' : '#2D211D';
  const secondaryColor = isDark ? '#D8C8C0' : '#7A655C';

  return (
    <VStack
      alignment="leading"
      spacing={3}
      modifiers={[padding({ all: 16 }), containerBackground(backgroundColor, 'widget')]}>
      <Text
        modifiers={[
          font({ size: 12, weight: 'bold', design: 'rounded' }),
          foregroundStyle('#F06F52'),
        ]}>
        NOURISH
      </Text>
      <Spacer />
      <Text
        modifiers={[
          font({ size: 34, weight: 'bold', design: 'rounded' }),
          foregroundStyle(primaryColor),
        ]}>
        {props.caloriesRemaining}
      </Text>
      <Text
        modifiers={[
          font({ size: 13, weight: 'medium', design: 'rounded' }),
          foregroundStyle(secondaryColor),
        ]}>
        kcal remaining
      </Text>
    </VStack>
  );
};

export default createWidget('RemainingCaloriesWidget', RemainingCalories);
