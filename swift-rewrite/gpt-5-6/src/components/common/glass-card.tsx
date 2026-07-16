// ports: twilight shared card recipe

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { CARD_RECIPE } from '@/components/common/visual-specs';
import { useTheme } from '@/theme/ThemeProvider';

interface GlassCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({ children, style }: GlassCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.shadow, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.stroke}
      >
        <BlurView
          blurMethod="dimezisBlurView"
          intensity={28}
          style={styles.blur}
          tint={theme.colorScheme}
        >
          <View style={[styles.content, { backgroundColor: theme.cardBackground }]}>{children}</View>
        </BlurView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: CARD_RECIPE.cornerRadius - CARD_RECIPE.strokeWidth,
    overflow: 'hidden',
  },
  content: {
    padding: CARD_RECIPE.padding,
  },
  shadow: {
    borderRadius: CARD_RECIPE.cornerRadius,
    marginHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { height: CARD_RECIPE.shadowOffsetY, width: 0 },
    shadowOpacity: CARD_RECIPE.shadowOpacity,
    shadowRadius: CARD_RECIPE.shadowRadius,
  },
  stroke: {
    borderRadius: CARD_RECIPE.cornerRadius,
    padding: CARD_RECIPE.strokeWidth,
  },
});
