export const DRAWER_FLING_VELOCITY = 650;

export function clampDrawerProgress(progress: number) {
  'worklet';
  return Math.min(1, Math.max(0, progress));
}

export function resolveDrawerTarget(progress: number, velocityX: number) {
  'worklet';
  if (velocityX >= DRAWER_FLING_VELOCITY) {
    return 1;
  }
  if (velocityX <= -DRAWER_FLING_VELOCITY) {
    return 0;
  }
  return progress >= 0.5 ? 1 : 0;
}
