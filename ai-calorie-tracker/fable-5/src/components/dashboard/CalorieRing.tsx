// animated circular calorie progress ring. pure presentation: the caller
// supplies an already-clamped progress value and semantic colors.
import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { motion } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CalorieRingProps = {
  // visual progress in the range 0..1
  progress: number;
  size: number;
  strokeWidth: number;
  trackColor: string;
  progressColor: string;
};

export function CalorieRing({
  progress,
  size,
  strokeWidth,
  trackColor,
  progressColor,
}: CalorieRingProps) {
  const [animatedProgress] = useState(() => new Animated.Value(progress));

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: motion.settle,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, progress]);

  const center = size / 2;
  const ringRadius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Calorie goal progress"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={ringRadius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={ringRadius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  );
}
