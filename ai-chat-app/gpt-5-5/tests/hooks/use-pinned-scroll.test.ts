import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { act, create } from 'react-test-renderer';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import {
  isPinnedToBottom,
  usePinnedScroll,
  type PinnedScrollController,
} from '@/hooks/usePinnedScroll';

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
  } as NativeSyntheticEvent<NativeScrollEvent>;
}

describe('isPinnedToBottom', () => {
  it('treats short content and near-bottom offsets as pinned', () => {
    expect(isPinnedToBottom({
      contentHeight: 400,
      layoutHeight: 600,
      offsetY: 0,
    })).toBe(true);
    expect(isPinnedToBottom({
      contentHeight: 1000,
      layoutHeight: 600,
      offsetY: 356,
    })).toBe(true);
  });

  it('treats offsets far from bottom as detached', () => {
    expect(isPinnedToBottom({
      contentHeight: 1400,
      layoutHeight: 600,
      offsetY: 240,
    })).toBe(false);
  });
});

describe('usePinnedScroll', () => {
  it('follows content growth only until the user scrolls away from the bottom', async () => {
    let controller: PinnedScrollController | undefined;
    const scrollToEnd = jest.fn();

    function Harness() {
      controller = usePinnedScroll();

      return null;
    }

    await act(async () => {
      create(React.createElement(Harness));
    });

    await act(async () => {
      controller!.bindListRef({ scrollToEnd });
      controller!.onContentSizeChange();
    });

    expect(scrollToEnd).toHaveBeenCalledTimes(1);
    expect(scrollToEnd).toHaveBeenLastCalledWith({ animated: true });
    expect(controller!.shouldShowScrollToBottom).toBe(false);

    await act(async () => {
      controller!.onScroll(createScrollEvent({
        contentHeight: 1400,
        layoutHeight: 600,
        offsetY: 240,
      }));
    });

    expect(controller!.shouldShowScrollToBottom).toBe(true);

    await act(async () => {
      controller!.onContentSizeChange();
    });

    expect(scrollToEnd).toHaveBeenCalledTimes(1);

    await act(async () => {
      controller!.scrollToBottom();
    });

    expect(scrollToEnd).toHaveBeenCalledTimes(2);
    expect(scrollToEnd).toHaveBeenLastCalledWith({ animated: false });
    expect(controller!.shouldShowScrollToBottom).toBe(false);
  });

  it('detaches immediately when the user starts dragging the transcript', async () => {
    let controller: PinnedScrollController | undefined;
    const scrollToEnd = jest.fn();

    function Harness() {
      controller = usePinnedScroll();

      return null;
    }

    await act(async () => {
      create(React.createElement(Harness));
    });

    await act(async () => {
      controller!.bindListRef({ scrollToEnd });
      controller!.onScrollBeginDrag();
    });

    expect(controller!.shouldShowScrollToBottom).toBe(true);

    await act(async () => {
      controller!.onContentSizeChange();
    });

    expect(scrollToEnd).not.toHaveBeenCalled();
  });
});
