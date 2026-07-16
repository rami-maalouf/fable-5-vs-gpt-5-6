// ports: twilight/views/sleepdashboardview.swift

import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { StarfieldView } from '@/components/common/starfield-view';
import { useTheme } from '@/theme/ThemeProvider';

export function ScreenBackground({ children }: PropsWithChildren) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.backgroundGradient} style={StyleSheet.absoluteFill} />
      <StarfieldView />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
