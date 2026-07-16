// the card recipe repeated across the app (spec design tokens):
// padding 16 -> thinMaterial -> radius 20 -> white 0.4->0.1 gradient stroke -> shadow
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function Card({
  children,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const tint = theme.name === 'sunset' ? 'systemThinMaterialLight' : 'systemThinMaterialDark';
  return (
    <View style={[styles.shadow, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.strokeRing}>
        <View style={styles.clip}>
          <BlurView intensity={100} tint={tint} style={StyleSheet.absoluteFill} />
          <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  strokeRing: {
    borderRadius: 20,
    padding: 1,
  },
  clip: {
    borderRadius: 19,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
});
