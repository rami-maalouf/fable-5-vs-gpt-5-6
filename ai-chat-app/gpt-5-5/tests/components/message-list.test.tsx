import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ComponentProps } from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { ActivityIndicator, FlatList, ScrollView, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MessageList } from '@/components/chat/MessageList';

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

jest.mock('react-native-reanimated', () => {
  const { Text, View } = require('react-native');

  const createBuilder = () => ({
    duration: () => createBuilder(),
  });

  return {
    __esModule: true,
    default: {
      Text,
      View,
    },
    FadeIn: createBuilder(),
    FadeInUp: createBuilder(),
    LinearTransition: createBuilder(),
  };
});

jest.mock('react-native-keyboard-controller', () => {
  const React = require('react');
  const { ScrollView, View } = require('react-native');

  return {
    KeyboardChatScrollView: React.forwardRef((props: Record<string, unknown>, ref: unknown) => (
      <ScrollView {...props} ref={ref} />
    )),
    KeyboardGestureArea: ({ children, ...props }: Record<string, unknown>) => (
      <View {...props}>{children}</View>
    ),
    KeyboardProvider: ({ children }: { children: unknown }) => (
      <View>{children}</View>
    ),
    KeyboardStickyView: ({ children, ...props }: Record<string, unknown>) => (
      <View {...props}>{children}</View>
    ),
  };
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

async function renderMessageList(props: ComponentProps<typeof MessageList>) {
  let tree: ReactTestRenderer | undefined;

  await act(async () => {
    tree = create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { height: 844, width: 390, x: 0, y: 0 },
          insets: { bottom: 34, left: 0, right: 0, top: 47 },
        }}
      >
        <MessageList {...props} />
      </SafeAreaProvider>,
    );
  });

  return tree!;
}

function createScrollEvent(input: {
  contentHeight: number;
  layoutHeight: number;
  offsetY: number;
}) {
  return {
    nativeEvent: {
      contentOffset: { x: 0, y: input.offsetY },
      contentSize: { height: input.contentHeight, width: 390 },
      layoutMeasurement: { height: input.layoutHeight, width: 390 },
    },
  };
}

describe('MessageList', () => {
  it('renders the empty state when there are no messages', async () => {
    const tree = await renderMessageList({
      isAwaitingFirstToken: false,
      messages: [],
    });

    expect(tree.root.findAllByType(Text).some((node) => (
      node.props.children === 'What should we explore?'
    ))).toBe(true);
  });

  it('renders user bubbles and assistant text rows', async () => {
    const tree = await renderMessageList({
      isAwaitingFirstToken: false,
      messages: [
        {
          content: 'hello',
          createdAt: 1,
          id: 'user-1',
          role: 'user',
          status: 'complete',
        },
        {
          content: 'hi from nova',
          createdAt: 2,
          id: 'assistant-1',
          role: 'assistant',
          status: 'complete',
        },
      ],
    });

    const visibleText = tree.root.findAllByType(Text).map((node) => node.props.children);

    expect(visibleText).toContain('hello');
    expect(visibleText).toContain('hi from nova');
  });

  it('renders a loading indicator before the first assistant token', async () => {
    const tree = await renderMessageList({
      isAwaitingFirstToken: true,
      messages: [
        {
          content: 'hello',
          createdAt: 1,
          id: 'user-1',
          role: 'user',
          status: 'complete',
        },
        {
          content: '',
          createdAt: 2,
          id: 'assistant-1',
          role: 'assistant',
          status: 'streaming',
        },
      ],
    });

    expect(tree.root.findByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders an inline error with retry for failed assistant messages', async () => {
    const retry = jest.fn();
    const tree = await renderMessageList({
      isAwaitingFirstToken: false,
      messages: [
        {
          content: 'hello',
          createdAt: 1,
          id: 'user-1',
          role: 'user',
          status: 'complete',
        },
        {
          content: 'partial reply',
          createdAt: 2,
          error: 'Network request failed',
          id: 'assistant-1',
          role: 'assistant',
          status: 'error',
        },
      ],
      onRetryMessage: retry,
    });

    const visibleText = tree.root.findAllByType(Text).map((node) => node.props.children);

    expect(visibleText).toContain('partial reply');
    expect(visibleText).toContain('Network request failed');
    expect(visibleText).toContain('Retry');

    const retryButton = tree.root.findAll((node) => (
      node.props.accessibilityLabel === 'retry response'
    ))[0];

    expect(retryButton).toBeDefined();

    await act(async () => {
      retryButton!.props.onPress();
    });

    expect(retry).toHaveBeenCalledWith('assistant-1');
  });

  it('uses a keyboard-aware scroll component for interactive dismissal', async () => {
    const tree = await renderMessageList({
      isAwaitingFirstToken: false,
      messages: [],
    });

    const flatList = tree.root.findByType(FlatList);
    const renderScrollComponent = flatList.props.renderScrollComponent;

    expect(renderScrollComponent).toEqual(expect.any(Function));

    let scrollTree: ReactTestRenderer | undefined;

    await act(async () => {
      scrollTree = create(renderScrollComponent({ children: null }));
    });

    expect(scrollTree).toBeDefined();
    const scrollView = scrollTree!.root.findByType(ScrollView);

    expect(flatList.props.keyboardDismissMode).toBe('interactive');
    expect(scrollView.props.keyboardDismissMode).toBe('interactive');
    expect(scrollView.props.keyboardLiftBehavior).toBe('whenAtEnd');
  });

  it('shows a scroll-to-bottom control when manual scrolling detaches auto-follow', async () => {
    const tree = await renderMessageList({
      isAwaitingFirstToken: false,
      messages: [
        {
          content: 'hello',
          createdAt: 1,
          id: 'user-1',
          role: 'user',
          status: 'complete',
        },
        {
          content: 'long reply',
          createdAt: 2,
          id: 'assistant-1',
          role: 'assistant',
          status: 'streaming',
        },
      ],
    });

    expect(tree.root.findAll((node) => (
      node.props.accessibilityLabel === 'scroll to latest message'
        && node.props.onPress != null
    ))).toHaveLength(0);

    const flatList = tree.root.findByType(FlatList);

    await act(async () => {
      flatList.props.onScroll(createScrollEvent({
        contentHeight: 1400,
        layoutHeight: 600,
        offsetY: 240,
      }));
    });

    expect(tree.root.findAll((node) => (
      node.props.accessibilityLabel === 'scroll to latest message'
        && node.props.onPress != null
    ))).toHaveLength(1);
  });

  it('detaches auto-follow when the user starts dragging the transcript', async () => {
    const tree = await renderMessageList({
      isAwaitingFirstToken: false,
      messages: [
        {
          content: 'hello',
          createdAt: 1,
          id: 'user-1',
          role: 'user',
          status: 'complete',
        },
        {
          content: 'long reply',
          createdAt: 2,
          id: 'assistant-1',
          role: 'assistant',
          status: 'complete',
        },
      ],
    });

    const flatList = tree.root.findByType(FlatList);

    await act(async () => {
      flatList.props.onScrollBeginDrag();
    });

    expect(tree.root.findAll((node) => (
      node.props.accessibilityLabel === 'scroll to latest message'
        && node.props.onPress != null
    ))).toHaveLength(1);
  });
});
