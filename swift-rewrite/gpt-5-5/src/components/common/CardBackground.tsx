import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { AppTheme } from '@/theme';

import { alphaColor, rgba } from './color';
import { cardBackgroundRecipe, cardRecipe } from './chrome-tokens';

type CardBackgroundProps = PropsWithChildren<{
  theme: AppTheme;
  active?: boolean;
  recipe?: 'large' | 'standard';
  style?: StyleProp<ViewStyle>;
}>;

export function CardBackground({ active = false, children, recipe = 'standard', style, theme }: CardBackgroundProps) {
  const radius = recipe === 'large' ? cardBackgroundRecipe.radius : cardRecipe.radius;

  return (
    <View
      style={[
        styles.shadow,
        {
          borderRadius: radius,
          shadowColor: '#000000',
          shadowOpacity: cardRecipe.shadowOpacity,
          shadowRadius: cardRecipe.shadowRadius,
          shadowOffset: { width: 0, height: cardRecipe.shadowYOffset },
        },
        style,
      ]}>
      <BlurView
        intensity={recipe === 'large' ? 22 : 30}
        tint="dark"
        style={[
          styles.card,
          {
            backgroundColor: alphaColor(theme.cardBackground),
            borderColor: rgba('#ffffff', recipe === 'large' ? cardBackgroundRecipe.strokeOpacity : 0.24),
            borderRadius: radius,
            padding: cardRecipe.padding,
          },
        ]}>
        <View
          pointerEvents="none"
          style={[
            styles.spotlight,
            {
              backgroundColor: rgba(active ? theme.success : theme.accent, cardBackgroundRecipe.spotlightOpacity),
            },
          ]}
        />
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    overflow: 'visible',
  },
  card: {
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  spotlight: {
    borderRadius: 48,
    height: 96,
    position: 'absolute',
    right: -32,
    top: '42%',
    width: 96,
  },
});
