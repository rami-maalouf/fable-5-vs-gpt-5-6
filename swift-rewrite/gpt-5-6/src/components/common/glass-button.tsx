// ports: twilight/components/common/glassbutton.swift

import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface GlassButtonProps {
  fullWidth?: boolean;
  icon?: SFSymbol;
  onLongPress?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  title: string;
}

export function GlassButton({
  fullWidth = false,
  icon,
  onLongPress,
  onPress,
  style,
  title,
}: GlassButtonProps) {
  const { theme } = useTheme();
  const [scale] = useState(() => new Animated.Value(1));

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      damping: 12,
      stiffness: 180,
      toValue,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  };

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        delayLongPress={800}
        onLongPress={handleLongPress}
        onPress={onPress}
        onPressIn={() => animateScale(0.96)}
        onPressOut={() => animateScale(1)}
      >
        <BlurView intensity={30} style={styles.button} tint={theme.colorScheme}>
          <View style={[styles.row, fullWidth && styles.center]}>
            {icon ? (
              <SymbolView name={icon} size={16} tintColor={theme.textPrimary} weight="medium" />
            ) : null}
            <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  center: {
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
});
