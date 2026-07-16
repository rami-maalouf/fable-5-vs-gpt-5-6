import { describe, expect, test } from 'bun:test';

import {
  BOTTOM_FOLLOW_THRESHOLD,
  getDistanceFromBottom,
  resolveManualScrollState,
} from '@/lib/pinned-scroll';

describe('pinned scroll', () => {
  test('measures remaining content without returning a negative distance', () => {
    expect(
      getDistanceFromBottom({
        contentOffsetY: 120,
        contentHeight: 800,
        viewportHeight: 500,
      }),
    ).toBe(180);
    expect(
      getDistanceFromBottom({
        contentOffsetY: 340,
        contentHeight: 800,
        viewportHeight: 500,
      }),
    ).toBe(0);
  });

  test('disengages above the threshold and re-engages at the bottom', () => {
    expect(resolveManualScrollState(BOTTOM_FOLLOW_THRESHOLD + 1)).toEqual({
      shouldFollow: false,
      showScrollToBottom: true,
    });
    expect(resolveManualScrollState(BOTTOM_FOLLOW_THRESHOLD)).toEqual({
      shouldFollow: true,
      showScrollToBottom: false,
    });
    expect(resolveManualScrollState(0)).toEqual({
      shouldFollow: true,
      showScrollToBottom: false,
    });
  });
});
