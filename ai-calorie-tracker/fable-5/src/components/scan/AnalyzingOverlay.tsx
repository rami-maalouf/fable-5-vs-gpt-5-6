// honest indeterminate treatment over the still-mounted photo while the
// backend analyzes. no fabricated percentage: the route gives no progress
// signal, so this shows only a subtle animated indicator and a label.
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { radius, spacing, typeScale } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/use-reduced-motion';
import { useThemeColors } from '@/theme/use-theme-colors';

const SPINNER_SIZE = 20;
const SPINNER_STROKE = 2.4;

export function AnalyzingOverlay() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  // stable animated nodes; useState initializer keeps them off the ref rule
  const [spin] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(1));

  // full-motion users get a small rotating arc; reduce-motion users get a
  // gentle opacity pulse with no transforms
  useEffect(() => {
    if (reducedMotion) {
      spin.stopAnimation();
      spin.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 0.45,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.stopAnimation();
    pulse.setValue(1);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, spin, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const center = SPINNER_SIZE / 2;
  const arcRadius = center - SPINNER_STROKE / 2;
  const circumference = 2 * Math.PI * arcRadius;

  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.area, { bottom: insets.bottom + spacing.xxxl }]}
    >
      <View style={[styles.pill, { backgroundColor: colors.stageScrim }]}>
        <Animated.View
          style={{
            opacity: pulse,
            transform: reducedMotion ? undefined : [{ rotate }],
          }}
        >
          <Svg width={SPINNER_SIZE} height={SPINNER_SIZE}>
            {/* quiet track plus a leading arc, tinted for the dark stage */}
            <Circle
              cx={center}
              cy={center}
              r={arcRadius}
              stroke={colors.onStage}
              strokeOpacity={0.25}
              strokeWidth={SPINNER_STROKE}
              fill="none"
            />
            <Circle
              cx={center}
              cy={center}
              r={arcRadius}
              stroke={colors.onStage}
              strokeWidth={SPINNER_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.28} ${circumference}`}
              fill="none"
            />
          </Svg>
        </Animated.View>
        <Text style={[styles.label, { color: colors.onStage }]}>
          Analyzing your meal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  label: {
    ...typeScale.bodyStrong,
  },
});
