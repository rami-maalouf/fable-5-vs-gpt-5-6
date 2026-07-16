import { useCallback, useRef, useState } from 'react';
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

// how far from the bottom (pt) the user must scroll before auto-follow
// disengages; also the re-engage threshold when they return
const FOLLOW_THRESHOLD = 60;

// pinned-to-bottom controller: auto-follow the growing newest message, but
// never fight a manual scroll-up. follow re-engages when the user returns to
// the bottom, or taps the scroll-to-bottom affordance.
export function usePinnedScroll<T>(listRef: React.RefObject<FlatList<T> | null>) {
  const [isFollowing, setIsFollowing] = useState(true);
  const followingRef = useRef(true);
  // true from drag start until momentum settles - only user-initiated
  // scrolling may change the follow state
  const userScrollingRef = useRef(false);

  const setFollowing = useCallback((value: boolean) => {
    followingRef.current = value;
    setIsFollowing((prev) => (prev === value ? prev : value));
  }, []);

  const evaluatePosition = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      setFollowing(distanceFromBottom <= FOLLOW_THRESHOLD);
    },
    [setFollowing],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (userScrollingRef.current) evaluatePosition(e);
    },
    [evaluatePosition],
  );

  const onScrollBeginDrag = useCallback(() => {
    userScrollingRef.current = true;
  }, []);

  const onScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      evaluatePosition(e);
    },
    [evaluatePosition],
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (userScrollingRef.current) {
        evaluatePosition(e);
        userScrollingRef.current = false;
      }
    },
    [evaluatePosition],
  );

  // called on every content growth; keeps the list pinned while following
  const onContentSizeChange = useCallback(() => {
    if (followingRef.current && !userScrollingRef.current) {
      listRef.current?.scrollToEnd({ animated: false });
    }
  }, [listRef]);

  const scrollToBottom = useCallback(() => {
    setFollowing(true);
    listRef.current?.scrollToEnd({ animated: true });
  }, [listRef, setFollowing]);

  return {
    isFollowing,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollEnd,
    onContentSizeChange,
    scrollToBottom,
  };
}
