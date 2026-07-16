// ports: twilight/components/common/starfieldview.swift

import { BlurMask, Canvas, Circle, useClock } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import {
  SHOOTING_STAR_SPEC,
  createStars,
  type StarSpec,
} from '@/components/common/visual-specs';

interface StarfieldViewProps {
  seed?: number;
  showShootingStars?: boolean;
  starCount?: number;
}

interface TwinklingStarProps {
  clock: SharedValue<number>;
  height: number;
  star: StarSpec;
  width: number;
}

function TwinklingStar({ clock, height, star, width }: TwinklingStarProps) {
  const opacity = useDerivedValue(() => {
    const elapsedSeconds = clock.value / 1_000 - star.delaySeconds;
    if (elapsedSeconds <= 0) {
      return 0.3;
    }
    const phase = (elapsedSeconds / star.twinkleDurationSeconds) * Math.PI;
    const amount = (Math.sin(phase) + 1) / 2;
    return 0.3 + amount * (star.initialOpacity - 0.3);
  });

  return (
    <Circle cx={star.x * width} cy={star.y * height} r={star.size / 2} color="white" opacity={opacity}>
      {star.size > 2.5 ? <BlurMask blur={0.5} style="normal" /> : null}
    </Circle>
  );
}

interface ShootingStarDotProps {
  clock: SharedValue<number>;
  height: number;
  index: number;
  width: number;
}

function useShootingStarProgress(clock: SharedValue<number>, index: number) {
  return useDerivedValue(() => {
    const elapsed = clock.value / 1_000 - SHOOTING_STAR_SPEC.firstDelaySeconds;
    if (elapsed < 0) {
      return 0;
    }
    const cycleDuration =
      SHOOTING_STAR_SPEC.durationSeconds + SHOOTING_STAR_SPEC.repeatDelaySeconds;
    const activeTime = elapsed % cycleDuration;
    if (activeTime > SHOOTING_STAR_SPEC.durationSeconds) {
      return 0;
    }
    return Math.max(
      0,
      activeTime / SHOOTING_STAR_SPEC.durationSeconds - index * SHOOTING_STAR_SPEC.trailLag,
    );
  });
}

function useShootingStarOpacity(clock: SharedValue<number>) {
  return useDerivedValue(() => {
    const elapsed = clock.value / 1_000 - SHOOTING_STAR_SPEC.firstDelaySeconds;
    if (elapsed < 0) {
      return 0;
    }
    const cycleDuration =
      SHOOTING_STAR_SPEC.durationSeconds + SHOOTING_STAR_SPEC.repeatDelaySeconds;
    const activeTime = elapsed % cycleDuration;
    if (activeTime > SHOOTING_STAR_SPEC.durationSeconds) {
      return 0;
    }
    const normalized = activeTime / SHOOTING_STAR_SPEC.durationSeconds;
    return normalized > 0.7 ? (1 - normalized) / 0.3 : Math.min(1, normalized / 0.1);
  });
}

function ShootingStarDot({ clock, height, index, width }: ShootingStarDotProps) {
  const progress = useShootingStarProgress(clock, index);
  const headOpacity = useShootingStarOpacity(clock);
  const opacity = useDerivedValue(
    () => headOpacity.value * ((SHOOTING_STAR_SPEC.trailCount - index) / 10),
  );
  const cx = useDerivedValue(
    () =>
      width * SHOOTING_STAR_SPEC.startX +
      SHOOTING_STAR_SPEC.travelX * (1 - (1 - progress.value) ** 2),
  );
  const cy = useDerivedValue(
    () =>
      height * SHOOTING_STAR_SPEC.startY +
      SHOOTING_STAR_SPEC.travelY * (1 - (1 - progress.value) ** 2),
  );
  const size = 4 - index / 3;

  return (
    <Circle cx={cx} cy={cy} r={size / 2} color="white" opacity={opacity}>
      {index > 0 ? <BlurMask blur={index * 0.3} style="normal" /> : null}
    </Circle>
  );
}

function ShootingStarHead({ clock, height, width }: Omit<ShootingStarDotProps, 'index'>) {
  const progress = useShootingStarProgress(clock, 0);
  const opacity = useShootingStarOpacity(clock);
  const cx = useDerivedValue(
    () =>
      width * SHOOTING_STAR_SPEC.startX +
      SHOOTING_STAR_SPEC.travelX * (1 - (1 - progress.value) ** 2),
  );
  const cy = useDerivedValue(
    () =>
      height * SHOOTING_STAR_SPEC.startY +
      SHOOTING_STAR_SPEC.travelY * (1 - (1 - progress.value) ** 2),
  );

  return (
    <Circle cx={cx} cy={cy} r={2.5} color="white" opacity={opacity}>
      <BlurMask blur={0.5} style="normal" />
    </Circle>
  );
}

function ShootingStar({ clock, height, width }: Omit<ShootingStarDotProps, 'index'>) {
  return (
    <>
      {Array.from({ length: SHOOTING_STAR_SPEC.trailCount }, (_, index) => (
        <ShootingStarDot key={index} clock={clock} height={height} index={index} width={width} />
      ))}
      <ShootingStarHead clock={clock} height={height} width={width} />
    </>
  );
}

export const StarfieldView = memo(function StarfieldView({
  seed = 42,
  showShootingStars = true,
  starCount,
}: StarfieldViewProps) {
  const { height, width } = useWindowDimensions();
  const clock = useClock();
  const stars = useMemo(() => createStars(seed, starCount), [seed, starCount]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={styles.canvas}>
        {stars.map((star) => (
          <TwinklingStar key={star.id} clock={clock} height={height} star={star} width={width} />
        ))}
        {showShootingStars ? <ShootingStar clock={clock} height={height} width={width} /> : null}
      </Canvas>
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
