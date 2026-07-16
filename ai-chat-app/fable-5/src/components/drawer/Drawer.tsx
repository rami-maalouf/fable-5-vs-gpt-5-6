import { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { KeyboardController } from 'react-native-keyboard-controller';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { DrawerContent } from '@/components/drawer/DrawerContent';
import { useDrawerStore } from '@/state/drawer-store';
import { colors } from '@/theme/tokens';

// width of the invisible strip along the left screen edge that arms the
// open gesture; small enough to never fight list taps or scrolling
const EDGE_HITBOX = 28;

// spring tuned for a chatgpt-like drawer: quick, no bounce
const SPRING = { damping: 34, stiffness: 320, mass: 0.8 } as const;

// velocity (pt/s) beyond which a release is treated as a fling
const FLING_VELOCITY = 500;

// custom interactive drawer: slides over the whole app (including the native
// header), tracks the finger 1:1 on the edge swipe, dims the chat behind
export function Drawer() {
  const open = useDrawerStore((s) => s.open);
  const setOpen = useDrawerStore((s) => s.setOpen);
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.round(screenWidth * 0.82);

  // closed = -drawerWidth, open = 0
  const translateX = useSharedValue(-drawerWidth);

  useEffect(() => {
    if (open) KeyboardController.dismiss();
    translateX.value = withSpring(open ? 0 : -drawerWidth, SPRING);
  }, [open, drawerWidth, translateX]);

  const settle = (shouldOpen: boolean) => {
    'worklet';
    translateX.value = withSpring(shouldOpen ? 0 : -drawerWidth, SPRING);
    runOnJS(setOpen)(shouldOpen);
  };

  const openPan = Gesture.Pan()
    .activeOffsetX(8)
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      'worklet';
      translateX.value = Math.min(0, Math.max(-drawerWidth, -drawerWidth + e.translationX));
    })
    .onEnd((e) => {
      'worklet';
      if (e.velocityX > FLING_VELOCITY) settle(true);
      else if (e.velocityX < -FLING_VELOCITY) settle(false);
      else settle(translateX.value > -drawerWidth / 2);
    });

  const closePan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      'worklet';
      translateX.value = Math.min(0, Math.max(-drawerWidth, e.translationX));
    })
    .onEnd((e) => {
      'worklet';
      if (e.velocityX < -FLING_VELOCITY) settle(false);
      else if (e.velocityX > FLING_VELOCITY) settle(true);
      else settle(translateX.value > -drawerWidth / 2);
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const dimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-drawerWidth, 0], [0, 1]),
  }));

  return (
    <>
      {/* edge strip arming the open gesture; only present while closed */}
      {!open && (
        <GestureDetector gesture={openPan}>
          <Animated.View style={styles.edgeHitbox} />
        </GestureDetector>
      )}

      {/* dim overlay; tap or drag left to close */}
      <GestureDetector gesture={closePan}>
        <Animated.View
          style={[styles.dim, dimStyle]}
          pointerEvents={open ? 'auto' : 'none'}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close sidebar"
          />
        </Animated.View>
      </GestureDetector>

      {/* the drawer panel itself; drag left on it to close */}
      <GestureDetector gesture={closePan}>
        <Animated.View
          style={[styles.panel, { width: drawerWidth }, panelStyle]}
          pointerEvents={open ? 'auto' : 'none'}
        >
          <DrawerContent />
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  edgeHitbox: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: EDGE_HITBOX,
    zIndex: 10,
  },
  dim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 11,
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.secondaryBackground,
    zIndex: 12,
  },
});
