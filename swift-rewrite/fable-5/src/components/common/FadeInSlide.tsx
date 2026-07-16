// ports: Components/Common/AnimationModifiers.swift (fadeInSlide)
// spring(response 0.4, damping 0.6) + delay; opacity 0 -> 1, y 30 -> 0
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

// response 0.4s, dampingFraction 0.6 -> stiffness (2pi/0.4)^2, damping 0.6*2*sqrt(k)
const SPRING = { mass: 1, stiffness: 247, damping: 18.9 };

export function FadeInSlide({
  delay = 0,
  slideOffset = 30,
  children,
  style,
}: {
  delay?: number;
  slideOffset?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay * 1000, withSpring(1, SPRING));
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * slideOffset }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
