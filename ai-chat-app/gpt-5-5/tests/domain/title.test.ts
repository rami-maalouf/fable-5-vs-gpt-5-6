import { describe, expect, it } from '@jest/globals';

import { deriveConversationTitle } from '@/domain';

describe('deriveConversationTitle', () => {
  it('normalizes short first messages', () => {
    expect(deriveConversationTitle('  hello    nova \n what now?  ')).toBe('hello nova what now?');
  });

  it('truncates long messages at a word boundary', () => {
    expect(
      deriveConversationTitle('Plan a thoughtful weekend in Montreal with museums and food')
    ).toBe('Plan a thoughtful weekend in Montreal...');
  });

  it('truncates long single words without exceeding the cap', () => {
    expect(deriveConversationTitle('supercalifragilisticexpialidocious question', 20)).toBe(
      'supercalifragilistic...'
    );
  });

  it('keeps unicode content intact while truncating', () => {
    expect(deriveConversationTitle('    こんにちは Nova とても長い相談をしたいです   ', 18)).toBe(
      'こんにちは Nova...'
    );
  });

  it('returns a fallback for whitespace-only input', () => {
    expect(deriveConversationTitle(' \n\t ')).toBe('Untitled conversation');
  });
});
