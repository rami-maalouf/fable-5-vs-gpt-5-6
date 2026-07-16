import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DRAWER_CLOSE_TIMING_CONFIG,
  DRAWER_OPEN_TIMING_CONFIG,
} from '@/components/drawer/drawerMotion';
import { spacing, useNovaTheme } from '@/theme';

type DrawerProps = {
  children?: ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const EDGE_WIDTH = 28;
const MAX_DRAWER_WIDTH = 340;
const MIN_DRAWER_WIDTH = 304;
const OPEN_VELOCITY = 520;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function clamp(value: number, min: number, max: number) {
  'worklet';

  return Math.min(Math.max(value, min), max);
}

export function Drawer({ children, isOpen, onOpenChange }: DrawerProps) {
  const theme = useNovaTheme();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(Math.max(width * 0.84, MIN_DRAWER_WIDTH), MAX_DRAWER_WIDTH);
  const progress = useSharedValue(isOpen ? 1 : 0);
  const dragStartProgress = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(
      isOpen ? 1 : 0,
      isOpen ? DRAWER_OPEN_TIMING_CONFIG : DRAWER_CLOSE_TIMING_CONFIG
    ));
  }, [isOpen, progress]);

  const settle = (shouldOpen: boolean) => {
    'worklet';

    progress.set(withTiming(
      shouldOpen ? 1 : 0,
      shouldOpen ? DRAWER_OPEN_TIMING_CONFIG : DRAWER_CLOSE_TIMING_CONFIG
    ));
    runOnJS(onOpenChange)(shouldOpen);
  };

  const edgeGesture = Gesture.Pan()
    .enabled(!isOpen)
    .activeOffsetX(8)
    .failOffsetY([-24, 24])
    .onBegin(() => {
      dragStartProgress.set(progress.get());
    })
    .onUpdate((event) => {
      progress.set(clamp(
        dragStartProgress.get() + event.translationX / drawerWidth,
        0,
        1
      ));
    })
    .onEnd((event) => {
      settle(progress.get() > 0.42 || event.velocityX > OPEN_VELOCITY);
    });

  const drawerGesture = Gesture.Pan()
    .enabled(isOpen)
    .activeOffsetX([-8, 8])
    .failOffsetY([-24, 24])
    .onBegin(() => {
      dragStartProgress.set(progress.get());
    })
    .onUpdate((event) => {
      progress.set(clamp(
        dragStartProgress.get() + event.translationX / drawerWidth,
        0,
        1
      ));
    })
    .onEnd((event) => {
      settle(progress.get() > 0.58 && event.velocityX > -OPEN_VELOCITY);
    });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-drawerWidth, 0]),
      },
    ],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.28]),
  }));

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <AnimatedPressable
        accessibilityElementsHidden={!isOpen}
        accessibilityLabel="close drawer"
        accessibilityRole="button"
        importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
        onPress={() => onOpenChange(false)}
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[styles.scrim, scrimStyle]}
      />

      <GestureDetector gesture={drawerGesture}>
        <Animated.View
          accessibilityElementsHidden={!isOpen}
          accessibilityLabel="conversation drawer"
          importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
          pointerEvents={isOpen ? 'auto' : 'none'}
          style={[
            styles.drawer,
            drawerStyle,
            {
              backgroundColor: theme.colors.elevated,
              borderRightColor: theme.colors.separator,
              width: drawerWidth,
            },
          ]}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.drawerSafeArea}>
            <View style={[styles.drawerHeader, { borderBottomColor: theme.colors.separator }]}>
              <Text style={[styles.drawerTitle, { color: theme.colors.text }]}>
                Conversations
              </Text>
            </View>
            <View style={styles.drawerBody}>{children}</View>
          </SafeAreaView>
        </Animated.View>
      </GestureDetector>

      <GestureDetector gesture={edgeGesture}>
        <View
          pointerEvents={isOpen ? 'none' : 'auto'}
          style={styles.edgeHitArea}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: '#000000',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  drawer: {
    bottom: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    left: 0,
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  drawerSafeArea: {
    flex: 1,
  },
  drawerHeader: {
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  drawerBody: {
    flex: 1,
  },
  edgeHitArea: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: EDGE_WIDTH,
    zIndex: 3,
  },
});
