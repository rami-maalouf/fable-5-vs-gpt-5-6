// animates a displayed number from the previously shown value to the new
// state-derived target over the shared settle duration, so the numerals land
// together with the calorie ring and macro bars after an accepted meal.
// reduce-motion users see the exact new value immediately with no count-up.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { motion } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/use-reduced-motion';

type AnimatedNumberProps = {
  value: number;
  // formats the in-flight numeric value into the display string; it must
  // produce the exact final text when called with the settled target
  format: (value: number) => string;
};

export function AnimatedNumber({ value, format }: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  // stable animated node; useState initializer keeps it off the ref rule
  const [animated] = useState(() => new Animated.Value(value));
  const [displayValue, setDisplayValue] = useState(value);
  // tracks what is currently shown so every animation starts from the value
  // the user is actually looking at, even when retargeted mid-flight
  const displayRef = useRef(value);

  useEffect(() => {
    const id = animated.addListener(({ value: shown }) => {
      displayRef.current = shown;
      setDisplayValue(shown);
    });
    return () => animated.removeListener(id);
  }, [animated]);

  useEffect(() => {
    if (value === displayRef.current) {
      return;
    }
    if (reducedMotion) {
      animated.stopAnimation();
      // setValue notifies the listener above, which shows the exact new
      // value immediately with no count-up
      animated.setValue(value);
      return;
    }
    const animation = Animated.timing(animated, {
      toValue: value,
      duration: motion.settle,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) {
        // land exactly on the derived target, never a rounded frame value
        displayRef.current = value;
        setDisplayValue(value);
      }
    });
    return () => animation.stop();
  }, [animated, value, reducedMotion]);

  return <>{format(displayValue)}</>;
}
