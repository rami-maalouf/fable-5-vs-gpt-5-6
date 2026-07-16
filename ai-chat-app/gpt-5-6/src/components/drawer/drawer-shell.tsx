import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import {
  clampDrawerProgress,
  resolveDrawerTarget,
} from '@/components/drawer/drawer-motion';
import { colors } from '@/theme/colors';

type DrawerControls = {
  openDrawer: () => void;
};

type DrawerShellProps = {
  children: (controls: DrawerControls) => ReactNode;
};

const EDGE_HIT_SLOP = 24;
const DRAWER_MAX_WIDTH = 360;
const ANIMATION_DURATION = 240;

export function DrawerShell({ children }: DrawerShellProps) {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(DRAWER_MAX_WIDTH, Math.max(280, screenWidth * 0.86));
  const progress = useSharedValue(0);
  const gestureStart = useSharedValue(0);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const animateDrawer = useCallback(
    (target: 0 | 1) => {
      if (target === 1) {
        setIsDrawerVisible(true);
      }
      progress.set(withTiming(
        target,
        { duration: ANIMATION_DURATION },
        (finished) => {
          if (finished) {
            scheduleOnRN(setIsDrawerVisible, target === 1);
          }
        },
      ));
    },
    [progress],
  );

  const openDrawer = useCallback(() => animateDrawer(1), [animateDrawer]);
  const closeDrawer = useCallback(() => animateDrawer(0), [animateDrawer]);

  const settleDrawer = (velocityX: number) => {
    'worklet';
    const target = resolveDrawerTarget(progress.get(), velocityX) as 0 | 1;
    progress.set(withTiming(
      target,
      { duration: ANIMATION_DURATION },
      (finished) => {
        if (finished) {
          scheduleOnRN(setIsDrawerVisible, target === 1);
        }
      },
    ));
  };

  const openGesture = Gesture.Pan()
    .enabled(!isDrawerVisible)
    .activeOffsetX(6)
    .failOffsetY([-16, 16])
    .onStart(() => {
      gestureStart.set(progress.get());
      scheduleOnRN(setIsDrawerVisible, true);
    })
    .onUpdate((event) => {
      progress.set(
        clampDrawerProgress(gestureStart.get() + event.translationX / drawerWidth),
      );
    })
    .onEnd((event) => settleDrawer(event.velocityX))
    .onFinalize((event, success) => {
      if (!success) {
        settleDrawer(event.velocityX);
      }
    });

  const closeGesture = Gesture.Pan()
    .enabled(isDrawerVisible)
    .activeOffsetX([-6, 6])
    .failOffsetY([-16, 16])
    .onStart(() => {
      gestureStart.set(progress.get());
    })
    .onUpdate((event) => {
      progress.set(
        clampDrawerProgress(gestureStart.get() + event.translationX / drawerWidth),
      );
    })
    .onEnd((event) => settleDrawer(event.velocityX))
    .onFinalize((event, success) => {
      if (!success) {
        settleDrawer(event.velocityX);
      }
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.get() * 0.36,
  }));
  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.get() - 1) * drawerWidth }],
  }));

  return (
    <View style={styles.root}>
      <View
        accessibilityElementsHidden={isDrawerVisible}
        importantForAccessibility={isDrawerVisible ? 'no-hide-descendants' : 'auto'}
        pointerEvents={isDrawerVisible ? 'none' : 'auto'}
        style={styles.content}>
        {children({ openDrawer })}
      </View>

      <Animated.View
        pointerEvents={isDrawerVisible ? 'auto' : 'none'}
        style={[styles.overlay, overlayStyle]}>
        <Pressable
          accessibilityLabel="Close conversations"
          accessibilityRole="button"
          onPress={closeDrawer}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <GestureDetector gesture={closeGesture}>
        <Animated.View
          accessibilityElementsHidden={!isDrawerVisible}
          importantForAccessibility={isDrawerVisible ? 'auto' : 'no-hide-descendants'}
          pointerEvents={isDrawerVisible ? 'auto' : 'none'}
          style={[styles.drawer, { width: drawerWidth }, drawerStyle]}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.drawerSafeArea}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Nova</Text>
              <Pressable
                accessibilityLabel="Close conversations"
                accessibilityRole="button"
                hitSlop={4}
                onPress={closeDrawer}
                style={styles.closeButton}>
                <SymbolView
                  name="xmark"
                  size={17}
                  tintColor={colors.secondaryLabel as string}
                />
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </GestureDetector>

      <GestureDetector gesture={openGesture}>
        <View
          accessibilityElementsHidden
          pointerEvents={isDrawerVisible ? 'none' : 'auto'}
          style={[styles.edgeGesture, { width: EDGE_HIT_SLOP }]}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: {
    flex: 1,
  },
  drawer: {
    backgroundColor: colors.background,
    bottom: 0,
    left: 0,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    top: 0,
    zIndex: 3,
  },
  drawerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 8,
  },
  drawerSafeArea: {
    flex: 1,
  },
  drawerTitle: {
    color: colors.label,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
  },
  edgeGesture: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    zIndex: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    zIndex: 2,
  },
  root: {
    flex: 1,
  },
});
