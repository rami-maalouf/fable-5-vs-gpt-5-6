// ports: twilight/components/common/starfieldview.swift

import { BlurMask, Canvas, Circle, useClock } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import {
  SHOOTING_STAR_SPEC,
  createShootingStarSequence,
  createStars,
  type ShootingStarSequence,
  type StarSpec,
} from '@/components/common/visual-specs';
import { SleepColorGroup } from '@/components/common/sleep-color-group';
import { useTheme } from '@/theme/ThemeProvider';

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
    const elapsed = clock.value / 1_000 - star.delaySeconds;
    if (elapsed <= 0) return 0.3;
    const cycleProgress = (elapsed / star.twinkleDurationSeconds) % 2;
    const amount = (1 - Math.cos(Math.PI * cycleProgress)) / 2;
    return 0.3 + amount * (star.initialOpacity - 0.3);
  });

  return (
    <Circle cx={star.x * width} cy={star.y * height} r={star.size / 2} color="white" opacity={opacity}>
      {star.size > 2.5 ? <BlurMask blur={0.5} style="normal" /> : null}
    </Circle>
  );
}

interface ShootingStarDotProps {
  height: number;
  index: number;
  state: SharedValue<ActiveShootingStarState>;
  width: number;
}

interface ActiveShootingStarState {
  durationSeconds: number;
  elapsedSeconds: number;
  isActive: boolean;
  startX: number;
  startY: number;
  travelX: number;
  travelY: number;
}

function useActiveShootingStar(
  clock: SharedValue<number>,
  sequence: ShootingStarSequence,
) {
  return useDerivedValue(() => {
    const elapsed = (clock.value / 1_000) % sequence.loopDurationSeconds;
    for (const event of sequence.events) {
      const eventElapsed = elapsed - event.startSeconds;
      if (eventElapsed >= 0 && eventElapsed <= event.durationSeconds) {
        return {
          durationSeconds: event.durationSeconds,
          elapsedSeconds: eventElapsed,
          isActive: true,
          startX: event.startX,
          startY: event.startY,
          travelX: event.travelX,
          travelY: event.travelY,
        };
      }
    }
    return {
      durationSeconds: 1,
      elapsedSeconds: 0,
      isActive: false,
      startX: 0,
      startY: 0,
      travelX: 0,
      travelY: 0,
    };
  });
}

function shootingStarOpacity(state: ActiveShootingStarState): number {
  'worklet';
  if (!state.isActive) return 0;
  const normalized = state.elapsedSeconds / state.durationSeconds;
  return normalized > 0.7 ? (1 - normalized) / 0.3 : Math.min(1, normalized / 0.1);
}

function ShootingStarDot({ height, index, state, width }: ShootingStarDotProps) {
  const progress = useDerivedValue(() => {
    if (!state.value.isActive) return 0;
    const normalized = Math.max(
      0,
      state.value.elapsedSeconds / state.value.durationSeconds -
        index * SHOOTING_STAR_SPEC.trailLag,
    );
    return 1 - (1 - normalized) ** 2;
  });
  const opacity = useDerivedValue(() =>
    shootingStarOpacity(state.value) * ((SHOOTING_STAR_SPEC.trailCount - index) / 10),
  );
  const cx = useDerivedValue(() => width * state.value.startX + state.value.travelX * progress.value);
  const cy = useDerivedValue(() => height * state.value.startY + state.value.travelY * progress.value);
  const size = 4 - index / 3;

  return (
    <Circle cx={cx} cy={cy} r={size / 2} color="white" opacity={opacity}>
      {index > 0 ? <BlurMask blur={index * 0.3} style="normal" /> : null}
    </Circle>
  );
}

function ShootingStarHead({ height, state, width }: Omit<ShootingStarDotProps, 'index'>) {
  const progress = useDerivedValue(() => {
    if (!state.value.isActive) return 0;
    const normalized = state.value.elapsedSeconds / state.value.durationSeconds;
    return 1 - (1 - normalized) ** 2;
  });
  const opacity = useDerivedValue(() => shootingStarOpacity(state.value));
  const cx = useDerivedValue(() => width * state.value.startX + state.value.travelX * progress.value);
  const cy = useDerivedValue(() => height * state.value.startY + state.value.travelY * progress.value);

  return (
    <Circle cx={cx} cy={cy} r={2.5} color="white" opacity={opacity}>
      <BlurMask blur={0.5} style="normal" />
    </Circle>
  );
}

function ShootingStar({ clock, height, sequence, width }: Omit<ShootingStarDotProps, 'index' | 'state'> & { clock: SharedValue<number>; sequence: ShootingStarSequence }) {
  const state = useActiveShootingStar(clock, sequence);
  return (
    <>
      {Array.from({ length: SHOOTING_STAR_SPEC.trailCount }, (_, index) => (
        <ShootingStarDot key={index} height={height} index={index} state={state} width={width} />
      ))}
      <ShootingStarHead height={height} state={state} width={width} />
    </>
  );
}

export const StarfieldView = memo(function StarfieldView({
  seed = 42,
  showShootingStars = true,
  starCount,
}: StarfieldViewProps) {
  const { height, width } = useWindowDimensions();
  const { isSleeping } = useTheme();
  const clock = useClock();
  const stars = useMemo(() => createStars(seed, starCount), [seed, starCount]);
  const shootingStars = useMemo(() => createShootingStarSequence(seed), [seed]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={styles.canvas}>
        <SleepColorGroup isSleeping={isSleeping}>
          {stars.map((star) => (
            <TwinklingStar key={star.id} clock={clock} height={height} star={star} width={width} />
          ))}
          {showShootingStars ? (
            <ShootingStar clock={clock} height={height} sequence={shootingStars} width={width} />
          ) : null}
        </SleepColorGroup>
      </Canvas>
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
