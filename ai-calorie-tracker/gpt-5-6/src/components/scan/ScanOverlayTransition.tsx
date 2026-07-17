import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  ReduceMotion,
  useReducedMotion,
} from "react-native-reanimated";

const overlayEntering = FadeInDown.duration(220).reduceMotion(
  ReduceMotion.System,
);
type ScanOverlayTransitionProps = PropsWithChildren<{
  reduceMotionOverride?: boolean;
  transitionKey: string;
}>;

export function ScanOverlayTransition({
  children,
  reduceMotionOverride,
  transitionKey,
}: ScanOverlayTransitionProps) {
  const systemReduceMotion = useReducedMotion();
  const reduceMotion = reduceMotionOverride ?? systemReduceMotion;

  return (
    <Animated.View
      accessibilityViewIsModal
      entering={reduceMotion ? undefined : overlayEntering}
      importantForAccessibility="yes"
      key={transitionKey}
      style={styles.overlay}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});
