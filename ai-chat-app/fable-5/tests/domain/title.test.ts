import { deriveTitle, TITLE_MAX_CHARS } from '@/domain/title';

describe('deriveTitle', () => {
  it('returns a short message unchanged', () => {
    expect(deriveTitle('hello nova')).toBe('hello nova');
  });

  it('trims and collapses whitespace and newlines', () => {
    expect(deriveTitle('  hello\n  nova  ')).toBe('hello nova');
  });

  it('truncates long messages at a word boundary with an ellipsis', () => {
    const long =
      'tell me a very long story about a spaceship crew exploring the outer rim';
    const title = deriveTitle(long);
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX_CHARS + 1);
    expect(title.endsWith('…')).toBe(true);
    // must not cut a word in half: everything before the ellipsis is a prefix
    // of the original ending at a word boundary
    const stem = title.slice(0, -1);
    expect(long.startsWith(stem)).toBe(true);
    expect(long[stem.length]).toBe(' ');
  });

  it('hard-cuts a single word longer than the limit', () => {
    const word = 'a'.repeat(60);
    const title = deriveTitle(word);
    expect(title).toBe('a'.repeat(TITLE_MAX_CHARS) + '…');
  });

  it('keeps short unicode text unchanged (code points, not utf-16 units)', () => {
    const emoji = '🚀'.repeat(30); // 60 utf-16 units but only 30 code points
    expect(deriveTitle(emoji)).toBe(emoji);
  });

  it('does not split surrogate pairs when truncating unicode text', () => {
    const emoji = '🚀'.repeat(50);
    const title = deriveTitle(emoji);
    expect(title.endsWith('…')).toBe(true);
    const stem = [...title.slice(0, -1)];
    expect(stem).toHaveLength(TITLE_MAX_CHARS);
    expect(stem.every((c) => c === '🚀')).toBe(true);
  });

  it('falls back for empty or whitespace-only input', () => {
    expect(deriveTitle('')).toBe('New chat');
    expect(deriveTitle('   \n ')).toBe('New chat');
  });
});
