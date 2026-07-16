import { describe, expect, it } from '@jest/globals';

import {
  CHAT_MODELS,
  DEFAULT_CHAT_MODEL,
  conversationMatchesSearch,
  filterConversationsBySearch,
  isChatModel,
} from '@/domain';

const conversations = [
  {
    id: 'c1',
    title: 'Weekend plan',
    messages: [{ content: 'Find quiet museums and good ramen.' }],
  },
  {
    id: 'c2',
    title: 'Launch notes',
    messages: [{ content: 'Retry copy for the network error state.' }],
  },
  {
    id: 'c3',
    title: 'Reading list',
    searchableContent: 'agent runtime docs',
  },
];

describe('chat model allowlist', () => {
  it('accepts exactly the supported models', () => {
    expect(CHAT_MODELS).toEqual(['gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra']);
    expect(DEFAULT_CHAT_MODEL).toBe('gpt-5.6-luna');
    expect(isChatModel('gpt-5.6-sol')).toBe(true);
    expect(isChatModel('gpt-4.1')).toBe(false);
  });
});

describe('conversation search', () => {
  it('matches titles case-insensitively', () => {
    expect(conversationMatchesSearch(conversations[0], 'weekend')).toBe(true);
    expect(conversationMatchesSearch(conversations[0], 'WEEKEND')).toBe(true);
  });

  it('matches message content', () => {
    expect(conversationMatchesSearch(conversations[1], 'network error')).toBe(true);
  });

  it('matches precomputed searchable content', () => {
    expect(conversationMatchesSearch(conversations[2], 'runtime')).toBe(true);
  });

  it('filters misses out', () => {
    expect(filterConversationsBySearch(conversations, 'sqlite')).toEqual([]);
  });

  it('treats an empty query as a match', () => {
    expect(filterConversationsBySearch(conversations, '   ').map((item) => item.id)).toEqual([
      'c1',
      'c2',
      'c3',
    ]);
  });
});
