import { describe, expect, it, jest } from '@jest/globals';
import type { ReactNode } from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { Text, View } from 'react-native';

import { Drawer } from '@/components/drawer/Drawer';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (Component: unknown) => Component,
    },
    interpolate: () => 0,
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    useAnimatedStyle: () => ({}),
    useSharedValue: (value: unknown) => ({
      get: () => value,
      set: jest.fn(),
      value,
    }),
    withTiming: (value: unknown) => value,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const chain = {
    activeOffsetX: () => chain,
    enabled: () => chain,
    failOffsetY: () => chain,
    onBegin: () => chain,
    onEnd: () => chain,
    onUpdate: () => chain,
  };

  return {
    Gesture: {
      Pan: () => chain,
    },
    GestureDetector: ({ children }: { children: ReactNode }) => children,
  };
});

describe('Drawer', () => {
  it('hides the closed drawer subtree from native accessibility', async () => {
    let tree: ReactTestRenderer | undefined;

    await act(async () => {
      tree = create(
        <Drawer isOpen={false} onOpenChange={() => undefined}>
          <Text>Hidden conversation</Text>
        </Drawer>
      );
    });

    if (!tree) {
      throw new Error('drawer test renderer did not mount');
    }

    const drawer = tree.root.findByProps({ accessibilityLabel: 'conversation drawer' });
    const scrim = tree.root.findByProps({ accessibilityLabel: 'close drawer' });

    expect(drawer.props.accessibilityElementsHidden).toBe(true);
    expect(drawer.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(scrim.props.accessibilityElementsHidden).toBe(true);
  });

  it('exposes the open drawer to native accessibility', async () => {
    let tree: ReactTestRenderer | undefined;

    await act(async () => {
      tree = create(
        <Drawer isOpen onOpenChange={() => undefined}>
          <Text>Visible conversation</Text>
        </Drawer>
      );
    });

    if (!tree) {
      throw new Error('drawer test renderer did not mount');
    }

    const drawer = tree.root.findByProps({ accessibilityLabel: 'conversation drawer' });
    const edgeHitArea = tree.root.findAllByType(View).at(-1);

    expect(drawer.props.accessibilityElementsHidden).toBe(false);
    expect(drawer.props.importantForAccessibility).toBe('auto');
    expect(edgeHitArea?.props.pointerEvents).toBe('none');
  });
});
