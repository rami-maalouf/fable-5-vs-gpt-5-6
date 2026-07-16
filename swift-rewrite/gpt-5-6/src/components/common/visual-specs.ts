// ports: twilight/components/common/starfieldview.swift, twilight/components/common/cardbackground.swift

export const STARFIELD_SPEC = Object.freeze({
  count: 40,
  size: [1.5, 3.5] as const,
  initialOpacity: [0.3, 0.8] as const,
  twinkleDurationSeconds: [1.5, 4] as const,
  delaySeconds: [0, 3] as const,
});

export const FADE_IN_SLIDE_SPEC = Object.freeze({
  dampingRatio: 0.6,
  durationMilliseconds: 400,
  offsetY: 30,
});

export const GLASS_PRESS_SPEC = Object.freeze({
  dampingRatio: 0.825,
  durationMilliseconds: 300,
  pressedScale: 0.96,
});

export const PICKER_ANIMATION_SPEC = Object.freeze({
  knobDampingRatio: 0.7,
  knobDurationMilliseconds: 300,
  knobScale: 1.15,
  pulseDurationMilliseconds: 2_000,
});

export const SHOOTING_STAR_SPEC = Object.freeze({
  firstDelaySeconds: [2.05, 4.05] as const,
  repeatDelaySeconds: [4, 7] as const,
  startX: [0.1, 0.5] as const,
  startY: [0, 0.25] as const,
  travelX: [150, 250] as const,
  travelY: [100, 180] as const,
  durationSeconds: [0.8, 1.2] as const,
  completionDelaySeconds: 0.1,
  sequenceLength: 12,
  trailCount: 8,
  trailLag: 0.04,
});

export const AURORA_SPEC = Object.freeze({
  blobCount: 5,
  alphaThreshold: 0.45,
  blur: 28,
});

export const GLOWING_MOON_SPEC = Object.freeze({
  color: '#ffd700',
  size: 80,
  legDurationMilliseconds: 3_000,
  blurScale: { resting: 0.6, glowing: 1.5 },
  glowScale: { resting: 1, glowing: 1.15 },
  iconScale: { resting: 1, glowing: 1.05 },
  glowLayers: [
    { radius: 40, opacity: 0.15 },
    { radius: 25, opacity: 0.25 },
    { radius: 12, opacity: 0.4 },
  ] as const,
});

export const CARD_RECIPE = Object.freeze({
  padding: 16,
  cornerRadius: 20,
  strokeWidth: 1,
  shadowOpacity: 0.1,
  shadowRadius: 10,
  shadowOffsetY: 5,
});

export interface StarSpec {
  id: number;
  x: number;
  y: number;
  size: number;
  initialOpacity: number;
  twinkleDurationSeconds: number;
  delaySeconds: number;
}

export interface ShootingStarEventSpec {
  durationSeconds: number;
  startSeconds: number;
  startX: number;
  startY: number;
  travelX: number;
  travelY: number;
}

export interface ShootingStarSequence {
  events: ShootingStarEventSpec[];
  loopDurationSeconds: number;
}

export interface AuroraBlobSpec {
  id: number;
  speed: number;
  sizeFactor: number;
  xAmplitude: number;
  yAmplitude: number;
  phaseX: number;
  phaseY: number;
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function randomInRange(random: () => number, range: readonly [number, number]): number {
  return range[0] + random() * (range[1] - range[0]);
}

export function createStars(seed: number, count: number = STARFIELD_SPEC.count): StarSpec[] {
  const random = seededRandom(seed);
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: random(),
    y: random(),
    size: randomInRange(random, STARFIELD_SPEC.size),
    initialOpacity: randomInRange(random, STARFIELD_SPEC.initialOpacity),
    twinkleDurationSeconds: randomInRange(random, STARFIELD_SPEC.twinkleDurationSeconds),
    delaySeconds: randomInRange(random, STARFIELD_SPEC.delaySeconds),
  }));
}

export function twinkleOpacityAt(
  star: Pick<StarSpec, 'delaySeconds' | 'initialOpacity' | 'twinkleDurationSeconds'>,
  elapsedSeconds: number,
): number {
  'worklet';
  const elapsed = elapsedSeconds - star.delaySeconds;
  if (elapsed <= 0) {
    return 0.3;
  }
  const cycleProgress = (elapsed / star.twinkleDurationSeconds) % 2;
  const amount = (1 - Math.cos(Math.PI * cycleProgress)) / 2;
  return 0.3 + amount * (star.initialOpacity - 0.3);
}

export function createShootingStarSequence(
  seed: number,
  count: number = SHOOTING_STAR_SPEC.sequenceLength,
): ShootingStarSequence {
  const random = seededRandom(seed ^ 0x9e3779b9);
  const events: ShootingStarEventSpec[] = [];
  let startSeconds = randomInRange(random, SHOOTING_STAR_SPEC.firstDelaySeconds);

  for (let index = 0; index < count; index += 1) {
    const event = {
      durationSeconds: randomInRange(random, SHOOTING_STAR_SPEC.durationSeconds),
      startSeconds,
      startX: randomInRange(random, SHOOTING_STAR_SPEC.startX),
      startY: randomInRange(random, SHOOTING_STAR_SPEC.startY),
      travelX: randomInRange(random, SHOOTING_STAR_SPEC.travelX),
      travelY: randomInRange(random, SHOOTING_STAR_SPEC.travelY),
    };
    events.push(event);
    startSeconds +=
      event.durationSeconds +
      SHOOTING_STAR_SPEC.completionDelaySeconds +
      randomInRange(random, SHOOTING_STAR_SPEC.repeatDelaySeconds);
  }

  return { events, loopDurationSeconds: startSeconds };
}

export function createAuroraBlobs(seed: number): AuroraBlobSpec[] {
  const random = seededRandom(seed);
  return Array.from({ length: AURORA_SPEC.blobCount }, (_, id) => ({
    id,
    speed: randomInRange(random, [0.18, 0.32]),
    sizeFactor: randomInRange(random, [0.3, 0.55]),
    xAmplitude: randomInRange(random, [0.75, 1.15]),
    yAmplitude: randomInRange(random, [0.75, 1.15]),
    phaseX: randomInRange(random, [0, Math.PI * 2]),
    phaseY: randomInRange(random, [0, Math.PI * 2]),
  }));
}
