import { useCallback, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export type ScrollMetrics = {
  contentHeight: number;
  layoutHeight: number;
  offsetY: number;
};

export type PinnedScrollListRef = {
  scrollToEnd: (params?: { animated?: boolean }) => void;
};

export type PinnedScrollController = {
  bindListRef: (list: PinnedScrollListRef | null) => void;
  isFollowing: boolean;
  onContentSizeChange: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: () => void;
  scrollToBottom: () => void;
  shouldShowScrollToBottom: boolean;
};

const PINNED_BOTTOM_THRESHOLD = 56;

export function isPinnedToBottom(
  metrics: ScrollMetrics,
  threshold = PINNED_BOTTOM_THRESHOLD
) {
  if (metrics.contentHeight <= metrics.layoutHeight) {
    return true;
  }

  const distanceFromBottom = (
    metrics.contentHeight
      - metrics.layoutHeight
      - metrics.offsetY
  );

  return distanceFromBottom <= threshold;
}

function toScrollMetrics(event: NativeScrollEvent): ScrollMetrics {
  return {
    contentHeight: event.contentSize.height,
    layoutHeight: event.layoutMeasurement.height,
    offsetY: Math.max(event.contentOffset.y, 0),
  };
}

export function usePinnedScroll(): PinnedScrollController {
  const listRef = useRef<PinnedScrollListRef | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);

  const bindListRef = useCallback((list: PinnedScrollListRef | null) => {
    listRef.current = list;
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsFollowing(isPinnedToBottom(toScrollMetrics(event.nativeEvent)));
  }, []);

  const onScrollBeginDrag = useCallback(() => {
    setIsFollowing(false);
  }, []);

  const onContentSizeChange = useCallback(() => {
    if (!isFollowing) {
      return;
    }

    listRef.current?.scrollToEnd({ animated: true });
  }, [isFollowing]);

  const scrollToBottom = useCallback(() => {
    setIsFollowing(true);
    listRef.current?.scrollToEnd({ animated: false });
  }, []);

  return {
    bindListRef,
    isFollowing,
    onContentSizeChange,
    onScroll,
    onScrollBeginDrag,
    scrollToBottom,
    shouldShowScrollToBottom: !isFollowing,
  };
}
