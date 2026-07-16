// ports: twilight/components/common/glowingmoonview.swift

import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { GLOWING_MOON_SPEC } from '@/components/common/visual-specs';
import { desaturateColor } from '@/theme/grayscale';
import { useTheme } from '@/theme/ThemeProvider';

interface GlowingMoonViewProps {
  color?: string;
  size?: number;
}

export function GlowingMoonView({
  color = GLOWING_MOON_SPEC.color,
  size = GLOWING_MOON_SPEC.size,
}: GlowingMoonViewProps) {
  const { isSleeping } = useTheme();
  const resolvedColor = isSleeping ? desaturateColor(color) : color;
  const [glow] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          duration: GLOWING_MOON_SPEC.durationMilliseconds / 2,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          duration: GLOWING_MOON_SPEC.durationMilliseconds / 2,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [glow]);

  return (
    <View style={[styles.container, { height: size * 1.8, width: size * 1.8 }]}>
      {GLOWING_MOON_SPEC.glowLayers.map((layer) => (
        <Animated.View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          key={layer.radius}
          pointerEvents="none"
          style={[
            styles.layer,
            {
              opacity: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [layer.opacity * 0.5, layer.opacity * 1.6],
              }),
              shadowColor: resolvedColor,
              shadowOpacity: 1,
              shadowRadius: layer.radius,
              transform: [
                {
                  scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }),
                },
              ],
            },
          ]}
        >
          <SymbolView name="moon.stars.fill" size={size} tintColor={resolvedColor} />
        </Animated.View>
      ))}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [
              { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
            ],
          },
        ]}
      >
        <SymbolView
          accessibilityLabel="Glowing moon"
          name="moon.stars.fill"
          size={size}
          tintColor={resolvedColor}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
  },
});
