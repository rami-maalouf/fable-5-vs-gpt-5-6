// every screen: zstack [ theme gradient ignoresSafeArea, starfield(40), content ]
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { StarfieldView } from './StarfieldView';
import { useTheme } from '@/theme/ThemeProvider';

export function Screen({
  children,
  starCount = 40,
  showShootingStars = true,
}: {
  children: React.ReactNode;
  starCount?: number;
  showShootingStars?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[theme.backgroundGradientStart, theme.backgroundGradientEnd]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <StarfieldView starCount={starCount} showShootingStars={showShootingStars} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
