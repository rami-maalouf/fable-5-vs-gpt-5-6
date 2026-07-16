import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import type { AppTheme } from '@/theme';

import { rgba } from './color';

type ButtonProps = PropsWithChildren<
  PressableProps & {
    theme: AppTheme;
    title: string;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
  }
>;

export function GlassButton({ fullWidth = false, onLongPress, onPressIn, style, theme, title, ...pressableProps }: ButtonProps) {
  return (
    <Pressable
      {...pressableProps}
      onLongPress={(event) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress?.(event);
      }}
      onPressIn={(event) => {
        onPressIn?.(event);
      }}
      style={({ pressed }) => [fullWidth && styles.fullWidth, pressed && styles.pressed, style]}>
      <BlurView intensity={28} tint="dark" style={[styles.glass, { borderColor: rgba(theme.textPrimary, 0.2) }]}>
        <Text style={[styles.glassText, { color: theme.textPrimary }]}>{title}</Text>
      </BlurView>
    </Pressable>
  );
}

export function RoundedButton({ fullWidth = false, onPressIn, style, theme, title, ...pressableProps }: ButtonProps) {
  return (
    <Pressable
      {...pressableProps}
      onPressIn={(event) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPressIn?.(event);
      }}
      style={({ pressed }) => [fullWidth && styles.fullWidth, pressed && styles.pressed, style]}>
      <BlurView intensity={18} tint="dark" style={[styles.rounded, { borderColor: rgba('#ffffff', 0.15) }]}>
        <Text style={[styles.roundedText, { color: theme.textSecondary }]}>{title}</Text>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  glass: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  glassText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rounded: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roundedText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
