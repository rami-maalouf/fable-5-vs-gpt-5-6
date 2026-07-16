// ports: twilight/components/common/starfieldview.swift, twilight/components/common/cardbackground.swift

export const STARFIELD_SPEC = Object.freeze({
  count: 40,
  size: [1.5, 3.5] as const,
  initialOpacity: [0.3, 0.8] as const,
  twinkleDurationSeconds: [1.5, 4] as const,
  delaySeconds: [0, 3] as const,
});

export const SHOOTING_STAR_SPEC = Object.freeze({
  firstDelaySeconds: 3,
  repeatDelaySeconds: 5.5,
  startX: 0.3,
  startY: 0.12,
  travelX: 200,
  travelY: 140,
  durationSeconds: 1,
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
  durationMilliseconds: 3_000,
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
