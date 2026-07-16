// ports: Components/Common/GlowingMoonView.swift
// sf symbol moon with 3 breathing glow layers (native shadow = blur that follows the icon alpha)
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useFixedColor } from '@/theme/ThemeProvider';

const GLOW_LAYERS = [
  { radius: 40, opacity: 0.15 },
  { radius: 25, opacity: 0.25 },
  { radius: 12, opacity: 0.4 },
];

function GlowLayer({
  radius,
  opacity,
  breath,
  color,
  size,
}: {
  radius: number;
  opacity: number;
  breath: { value: number };
  color: string;
  size: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(breath.value, [0, 1], [opacity * 0.5, opacity * 1.6]),
    shadowRadius: interpolate(breath.value, [0, 1], [radius * 0.6, radius * 1.5]),
    transform: [{ scale: interpolate(breath.value, [0, 1], [1.0, 1.15]) }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.center, style, { shadowColor: color, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 } }]}>
      <MoonIcon color={color} size={size} />
    </Animated.View>
  );
}

function MoonIcon({ color, size }: { color: string; size: number }) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name="moon.stars.fill"
        size={size}
        tintColor={color}
        resizeMode="scaleAspectFit"
      />
    );
  }
  // android fallback: plain circle glow carrier (polish out of scope per spec priority 8)
  const style = { width: size, height: size, borderRadius: size / 2, backgroundColor: color };
  return <View style={style} />;
}

export function GlowingMoonView({
  accentColor = '#ffd700',
  size = 80,
}: {
  accentColor?: string;
  size?: number;
}) {
  const fixed = useFixedColor();
  const moonColor = fixed(accentColor);
  const breath = useSharedValue(0);

  useEffect(() => {
    // easeInOut 3.0s repeatForever autoreverse
    breath.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [breath]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breath.value, [0, 1], [1.0, 1.05]) }],
  }));

  // the container is sized generously so glow layers are not clipped
  const box = size * 2;
  return (
    <View style={[styles.center, { width: box, height: box }]}>
      {GLOW_LAYERS.map((layer) => (
        <GlowLayer
          key={layer.radius}
          radius={layer.radius}
          opacity={layer.opacity}
          breath={breath}
          color={moonColor}
          size={size}
        />
      ))}
      <Animated.View style={iconStyle}>
        <MoonIcon color={moonColor} size={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
