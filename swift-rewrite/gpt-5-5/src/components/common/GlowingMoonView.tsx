import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { rgba } from './color';
import { glowingMoonLayers } from './chrome-tokens';

type GlowingMoonViewProps = {
  color?: string;
  size?: number;
};

export function GlowingMoonView({ color = '#ffd700', size = 80 }: GlowingMoonViewProps) {
  const [glow] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [glow]);

  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  return (
    <View style={[styles.container, { height: size * 1.9, width: size * 1.9 }]}>
      {glowingMoonLayers.map((layer) => (
        <Animated.View
          key={layer.radius}
          style={[
            styles.glow,
            {
              backgroundColor: rgba(color, layer.opacity),
              borderRadius: layer.radius,
              height: layer.radius * 2,
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
              width: layer.radius * 2,
            },
          ]}
        />
      ))}
      <Animated.View style={{ transform: [{ scale }] }}>
        <SymbolView name={{ ios: 'moon.stars.fill', android: 'bedtime', web: 'bedtime' }} size={size} tintColor={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: -8,
    top: 48,
  },
  glow: {
    position: 'absolute',
  },
});
