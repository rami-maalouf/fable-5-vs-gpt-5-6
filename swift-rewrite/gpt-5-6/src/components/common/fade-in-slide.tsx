import { useEffect, type PropsWithChildren } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

export function FadeInSlide({
  children,
  delay = 0,
}: PropsWithChildren<{ delay?: number }>) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 100 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 12, stiffness: 100 }));
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
