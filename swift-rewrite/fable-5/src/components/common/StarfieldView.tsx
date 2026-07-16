// ports: Components/Common/StarfieldView.swift
// 40 twinkling stars + periodic shooting star with 8-circle trail, drawn with skia
import { BlurMask, Canvas, Circle, Group, useClock } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

interface Star {
  x: number;
  y: number;
  size: number;
  initialOpacity: number;
  twinkleDuration: number;
  delay: number;
}

interface ShootingStar {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  // ms on the skia clock when the run began
  startedAt: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function makeStars(count: number, width: number, height: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: rand(0, width),
    y: rand(0, height),
    size: rand(1.5, 3.5),
    initialOpacity: rand(0.3, 0.8),
    twinkleDuration: rand(1.5, 4.0),
    delay: rand(0, 3.0),
  }));
}

function easeInOut(x: number): number {
  'worklet';
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
}

function easeOut(x: number): number {
  'worklet';
  return 1 - (1 - x) * (1 - x);
}

function TwinklingStar({ star, clock }: { star: Star; clock: { value: number } }) {
  const opacity = useDerivedValue(() => {
    const t = clock.value / 1000 - star.delay;
    if (t <= 0) return 0.3;
    // easeInOut repeatForever autoreverse between 0.3 and initialOpacity
    const phase = (t / star.twinkleDuration) % 2;
    const x = phase < 1 ? phase : 2 - phase;
    return 0.3 + (star.initialOpacity - 0.3) * easeInOut(x);
  });
  return (
    <Circle cx={star.x} cy={star.y} r={star.size / 2} color="white" opacity={opacity}>
      {star.size > 2.5 ? <BlurMask blur={0.5} style="normal" /> : null}
    </Circle>
  );
}

// trail sizes/opacities per the swift integer math: size 4 - i/3, opacity (8-i)/10
const TRAIL = Array.from({ length: 8 }, (_, i) => ({
  index: i,
  lag: i * 0.04,
  opacity: (8 - i) / 10,
  size: 4 - Math.trunc(i / 3),
  blur: i * 0.3,
}));

function ShootingStarLayer({
  star,
  clock,
}: {
  star: ShootingStar | null;
  clock: { value: number };
}) {
  const progress = useDerivedValue(() => {
    if (!star) return 1;
    const t = (clock.value - star.startedAt) / 1000 / star.duration;
    return easeOut(Math.min(1, Math.max(0, t)));
  });
  // fade in over 0.1s, fade out over the last 30% of the run
  const opacity = useDerivedValue(() => {
    if (!star) return 0;
    const elapsed = (clock.value - star.startedAt) / 1000;
    const fadeIn = Math.min(1, elapsed / 0.1);
    const fadeOutStart = star.duration * 0.7;
    const fadeOut =
      elapsed <= fadeOutStart
        ? 1
        : Math.max(0, 1 - (elapsed - fadeOutStart) / (star.duration * 0.3));
    return fadeIn * fadeOut;
  });

  const headX = useDerivedValue(() =>
    star ? star.startX + (star.endX - star.startX) * progress.value : 0
  );
  const headY = useDerivedValue(() =>
    star ? star.startY + (star.endY - star.startY) * progress.value : 0
  );

  if (!star) return null;
  return (
    <Group>
      {TRAIL.map((seg) => {
        return <TrailCircle key={seg.index} seg={seg} star={star} progress={progress} opacity={opacity} />;
      })}
      {/* bright head: 5x5 white, blur 0.5, white shadow r3 (soft halo circle) */}
      <Circle cx={headX} cy={headY} r={3.5} color="white" opacity={opacity}>
        <BlurMask blur={3} style="normal" />
      </Circle>
      <Circle cx={headX} cy={headY} r={2.5} color="white" opacity={opacity}>
        <BlurMask blur={0.5} style="normal" />
      </Circle>
    </Group>
  );
}

function TrailCircle({
  seg,
  star,
  progress,
  opacity,
}: {
  seg: (typeof TRAIL)[number];
  star: ShootingStar;
  progress: { value: number };
  opacity: { value: number };
}) {
  const cx = useDerivedValue(() => {
    const p = Math.max(0, progress.value - seg.lag);
    return star.startX + (star.endX - star.startX) * p;
  });
  const cy = useDerivedValue(() => {
    const p = Math.max(0, progress.value - seg.lag);
    return star.startY + (star.endY - star.startY) * p;
  });
  const segOpacity = useDerivedValue(() => seg.opacity * opacity.value);
  return (
    <Circle cx={cx} cy={cy} r={seg.size / 2} color="white" opacity={segOpacity}>
      {seg.blur > 0 ? <BlurMask blur={seg.blur} style="normal" /> : null}
    </Circle>
  );
}

export function StarfieldView({
  starCount = 40,
  showShootingStars = true,
}: {
  starCount?: number;
  showShootingStars?: boolean;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [shootingStar, setShootingStar] = useState<ShootingStar | null>(null);
  const clock = useClock();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stars = useMemo(
    () => (size.width > 0 ? makeStars(starCount, size.width, size.height) : []),
    [starCount, size]
  );

  useEffect(() => {
    if (!showShootingStars || size.width === 0) return;

    let cancelled = false;
    const trigger = () => {
      if (cancelled) return;
      const startX = rand(size.width * 0.1, size.width * 0.5);
      const startY = rand(0, size.height * 0.25);
      const duration = rand(0.8, 1.2);
      setShootingStar({
        startX,
        startY,
        endX: startX + rand(150, 250),
        endY: startY + rand(100, 180),
        duration,
        startedAt: clock.value,
      });
      // clear, then schedule the next one 4-7s later (matches swift cadence)
      timer.current = setTimeout(() => {
        setShootingStar(null);
        timer.current = setTimeout(trigger, rand(4, 7) * 1000);
      }, duration * 1000 + 100);
    };

    timer.current = setTimeout(trigger, 50 + rand(2, 4) * 1000);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [showShootingStars, size, clock]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize((prev) =>
        Math.abs(prev.width - width) > 10 || Math.abs(prev.height - height) > 10
          ? { width, height }
          : prev
      );
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {size.width > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          {stars.map((star, i) => (
            <TwinklingStar key={i} star={star} clock={clock} />
          ))}
          {showShootingStars && <ShootingStarLayer star={shootingStar} clock={clock} />}
        </Canvas>
      )}
    </View>
  );
}
