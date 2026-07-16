import { describe, expect, it } from '@jest/globals';
import type { ComponentProps } from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { ActivityIndicator, Text } from 'react-native';

import { MessageList } from '@/components/chat/MessageList';

async function renderMessageList(props: ComponentProps<typeof MessageList>) {
  let tree: ReactTestRenderer | undefined;

  await act(async () => {
    tree = create(<MessageList {...props} />);
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
});
