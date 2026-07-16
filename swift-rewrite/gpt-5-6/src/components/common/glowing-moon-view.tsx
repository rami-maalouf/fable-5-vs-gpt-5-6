// ports: twilight/components/common/glowingmoonview.swift

import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

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
          duration: GLOWING_MOON_SPEC.legDurationMilliseconds,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          duration: GLOWING_MOON_SPEC.legDurationMilliseconds,
          easing: Easing.inOut(Easing.ease),
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
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          key={layer.radius}
          pointerEvents="none"
          style={styles.layer}
        >
          <GlowLayer
            glow={glow}
            glowing
            opacity={layer.opacity}
            radius={layer.radius}
            resolvedColor={resolvedColor}
            size={size}
          />
          <GlowLayer
            glow={glow}
            glowing={false}
            opacity={layer.opacity}
            radius={layer.radius}
            resolvedColor={resolvedColor}
            size={size}
          />
        </View>
      ))}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [
              {
                scale: glow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    GLOWING_MOON_SPEC.iconScale.resting,
                    GLOWING_MOON_SPEC.iconScale.glowing,
                  ],
                }),
              },
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

function GlowLayer({
  glow,
  glowing,
  opacity,
  radius,
  resolvedColor,
  size,
}: {
  glow: Animated.Value;
  glowing: boolean;
  opacity: number;
  radius: number;
  resolvedColor: string;
  size: number;
}) {
  const endpoints = glowing ? [0, opacity * 1.6] : [opacity * 0.5, 0];
  const blurScale = glowing
    ? GLOWING_MOON_SPEC.blurScale.glowing
    : GLOWING_MOON_SPEC.blurScale.resting;
  return (
    <Animated.View
      style={[
        styles.layer,
        {
          opacity: glow.interpolate({ inputRange: [0, 1], outputRange: endpoints }),
          shadowColor: resolvedColor,
          shadowOpacity: 1,
          shadowRadius: radius * blurScale,
          transform: [
            {
              scale: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  GLOWING_MOON_SPEC.glowScale.resting,
                  GLOWING_MOON_SPEC.glowScale.glowing,
                ],
              }),
            },
          ],
        },
      ]}
    >
      <SymbolView name="moon.stars.fill" size={size} tintColor={resolvedColor} />
    </Animated.View>
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
