/// <reference types="bun" />

import { describe, expect, test } from 'bun:test';

import { toLikePattern } from '@/lib/db-values';

describe('database values', () => {
  test('escapes wildcard and escape characters in search text', () => {
    expect(toLikePattern('50%_off\\today')).toBe('%50\\%\\_off\\\\today%');
  });

  test('trims search text before wrapping it as a contains pattern', () => {
    expect(toLikePattern('  city plan  ')).toBe('%city plan%');
  });
});
