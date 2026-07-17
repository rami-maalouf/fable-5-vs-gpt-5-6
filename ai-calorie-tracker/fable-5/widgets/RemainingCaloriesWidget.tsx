import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type RemainingCaloriesWidgetProps = {
  // display-ready whole number of calories left today
  remaining: number;
};

const RemainingCaloriesWidgetComponent = (
  props: RemainingCaloriesWidgetProps,
  environment: WidgetEnvironment,
) => {
  'widget';
  const isDark = environment.colorScheme === 'dark';
  const primaryColor = isDark ? '#F5EFE9' : '#2A2118';
  const accentColor = '#E8654A';

  return (
    <VStack>
      <Text
        modifiers={[
          font({ weight: 'semibold', size: 13 }),
          foregroundStyle(accentColor),
        ]}
      >
        Nourish
      </Text>
      <Text
        modifiers={[
          font({ weight: 'bold', size: 34 }),
          foregroundStyle(primaryColor),
        ]}
      >
        {String(props.remaining)}
      </Text>
      <Text
        modifiers={[
          font({ weight: 'regular', size: 12 }),
          foregroundStyle(primaryColor),
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
