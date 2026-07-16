import { conversationMatches, filterConversations } from '@/domain/search';

const entries = [
  { id: 'a', title: 'Trip planning', content: 'we should visit Kyoto in spring' },
  { id: 'b', title: 'Recipe ideas', content: 'how do i make sourdough bread' },
  { id: 'c', title: 'Workout plan', content: '' },
];

describe('conversationMatches', () => {
  it('matches on title, case-insensitive', () => {
    expect(conversationMatches('trip', 'Trip planning', 'nothing here')).toBe(true);
    expect(conversationMatches('TRIP', 'trip planning', '')).toBe(true);
  });

  it('matches on message content, case-insensitive', () => {
    expect(conversationMatches('kyoto', 'Trip planning', 'visit Kyoto in spring')).toBe(true);
  });

  it('does not match when neither title nor content contains the query', () => {
    expect(conversationMatches('bread', 'Trip planning', 'visit kyoto')).toBe(false);
  });

  it('treats empty or whitespace query as match-all', () => {
    expect(conversationMatches('', 'anything', '')).toBe(true);
    expect(conversationMatches('   ', 'anything', '')).toBe(true);
  });
});

describe('filterConversations', () => {
  it('returns all entries for an empty query', () => {
    expect(filterConversations(entries, '')).toHaveLength(3);
  });

  it('filters by title or content and preserves order', () => {
    expect(filterConversations(entries, 'plan').map((e) => e.id)).toEqual(['a', 'c']);
    expect(filterConversations(entries, 'sourdough').map((e) => e.id)).toEqual(['b']);
  });

  it('returns empty when nothing matches', () => {
    expect(filterConversations(entries, 'zebra')).toHaveLength(0);
  });
});
