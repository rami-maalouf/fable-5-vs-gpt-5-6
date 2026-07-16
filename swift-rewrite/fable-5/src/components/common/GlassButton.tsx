// ports: Components/Common/GlassButton.swift
// hstack icon 16 medium + subheadline semibold title, thinMaterial radius 16,
// press scale 0.96 spring(0.3); long-press 0.8s fires medium haptic
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

// swift .spring(response: 0.3) equivalent
const PRESS_SPRING = { mass: 1, damping: 18, stiffness: 440 };

export function GlassButton({
  title,
  icon,
  onPress,
  fullWidth = true,
  longPressEnabled = false,
  longPressDuration = 800,
  color,
  style,
}: {
  title: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  fullWidth?: boolean;
  longPressEnabled?: boolean;
  longPressDuration?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const pressed = useSharedValue(0);
  const tint = theme.name === 'sunset' ? 'systemThinMaterialLight' : 'systemThinMaterialDark';
  const foreground = color ?? theme.textPrimary;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.96 : 1, PRESS_SPRING) }],
  }));

  const fire = () => {
    if (longPressEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <Animated.View style={[animatedStyle, fullWidth && styles.fullWidth, style]}>
      <Pressable
        onPressIn={() => {
          pressed.value = 1;
        }}
        onPressOut={() => {
          pressed.value = 0;
        }}
        onPress={longPressEnabled ? undefined : fire}
        onLongPress={longPressEnabled ? fire : undefined}
        delayLongPress={longPressEnabled ? longPressDuration : undefined}>
        <View style={styles.clip}>
          <BlurView intensity={100} tint={tint} style={StyleSheet.absoluteFill} />
          <View
            style={[
              styles.content,
              !fullWidth && styles.contentHug,
              { borderColor: hexToRgba(foreground, 0.2) },
            ]}>
            <SymbolView name={icon} size={16} weight="medium" tintColor={foreground} />
            <Text style={[styles.title, { color: foreground }]}>{title}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function hexToRgba(color: string, alpha: number): string {
  if (!color.startsWith('#')) return color;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  clip: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  contentHug: { paddingHorizontal: 24, alignSelf: 'center' },
  // subheadline semibold
  title: { fontSize: 15, fontWeight: '600' },
});
