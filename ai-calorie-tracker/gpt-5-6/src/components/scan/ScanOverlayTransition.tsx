import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

const overlayEntering = FadeInDown.duration(220).reduceMotion(
  ReduceMotion.System,
);
type ScanOverlayTransitionProps = PropsWithChildren<{
  transitionKey: string;
}>;

export function ScanOverlayTransition({
  children,
  transitionKey,
}: ScanOverlayTransitionProps) {
  return (
    <Animated.View
      entering={overlayEntering}
      key={transitionKey}
      style={styles.overlay}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});
