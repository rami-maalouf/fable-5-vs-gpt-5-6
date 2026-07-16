/// <reference types="bun" />

import { describe, expect, test } from 'bun:test';

import { createConversationTitle, restoreChatMessages } from '@/lib/chat-persistence';

describe('chat persistence values', () => {
  test('creates a compact title capped at forty characters', () => {
    const title = createConversationTitle(
      '  Design   a resilient neighborhood with public gardens and transit  ',
    );

    expect(title).toBe('Design a resilient neighborhood with...');
    expect(title.length).toBeLessThanOrEqual(40);
  });

  test('restores persisted messages as completed chat rows', () => {
    expect(
      restoreChatMessages([
        {
          id: 'message-1',
          conversationId: 'conversation-1',
          role: 'assistant',
          content: 'Welcome back.',
          createdAt: 10,
        },
      ]),
    ).toEqual([
      {
        id: 'message-1',
        role: 'assistant',
        content: 'Welcome back.',
        status: 'complete',
      },
    ]);
  });
});
