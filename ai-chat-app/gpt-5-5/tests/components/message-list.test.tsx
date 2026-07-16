import { describe, expect, it, jest } from '@jest/globals';
import type { ComponentProps } from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { ActivityIndicator, FlatList, ScrollView, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MessageList } from '@/components/chat/MessageList';

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
});
