import { useEffect, type PropsWithChildren } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { FADE_IN_SLIDE_SPEC } from '@/components/common/visual-specs';

export function FadeInSlide({
  children,
  delay = 0,
}: PropsWithChildren<{ delay?: number }>) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue<number>(FADE_IN_SLIDE_SPEC.offsetY);

  useEffect(() => {
    const spring = {
      dampingRatio: FADE_IN_SLIDE_SPEC.dampingRatio,
      duration: FADE_IN_SLIDE_SPEC.durationMilliseconds,
    };
    opacity.value = withDelay(delay, withSpring(1, spring));
    translateY.value = withDelay(delay, withSpring(0, spring));
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
