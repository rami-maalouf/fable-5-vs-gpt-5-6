export const BOTTOM_FOLLOW_THRESHOLD = 48;

type ScrollMetrics = {
  contentHeight: number;
  contentOffsetY: number;
  viewportHeight: number;
};

export function getDistanceFromBottom({
  contentHeight,
  contentOffsetY,
  viewportHeight,
}: ScrollMetrics) {
  return Math.max(0, contentHeight - contentOffsetY - viewportHeight);
}

export function resolveManualScrollState(distanceFromBottom: number) {
  const shouldFollow = distanceFromBottom <= BOTTOM_FOLLOW_THRESHOLD;

  return {
    shouldFollow,
    showScrollToBottom: !shouldFollow,
  };
}
