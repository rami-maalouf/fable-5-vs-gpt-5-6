import {
  AURORA_SPEC,
  CARD_RECIPE,
  GLOWING_MOON_SPEC,
  SHOOTING_STAR_SPEC,
  STARFIELD_SPEC,
  createAuroraBlobs,
  createStars,
} from '../src/components/common/visual-specs';

describe('screen chrome visual specs', () => {
  it('creates the exact default star count inside every Swift range', () => {
    const stars = createStars(42);

    expect(stars).toHaveLength(40);
    for (const star of stars) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(1);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(1);
      expect(star.size).toBeGreaterThanOrEqual(1.5);
      expect(star.size).toBeLessThanOrEqual(3.5);
      expect(star.initialOpacity).toBeGreaterThanOrEqual(0.3);
      expect(star.initialOpacity).toBeLessThanOrEqual(0.8);
      expect(star.twinkleDurationSeconds).toBeGreaterThanOrEqual(1.5);
      expect(star.twinkleDurationSeconds).toBeLessThanOrEqual(4);
      expect(star.delaySeconds).toBeGreaterThanOrEqual(0);
      expect(star.delaySeconds).toBeLessThanOrEqual(3);
    }
    expect(STARFIELD_SPEC.count).toBe(40);
  });

  it('keeps the shooting star, moon, cards, and aurora at normative values', () => {
    expect(SHOOTING_STAR_SPEC).toEqual({
      firstDelaySeconds: [2.05, 4.05],
      repeatDelaySeconds: [4, 7],
      startX: [0.1, 0.5],
      startY: [0, 0.25],
      travelX: [150, 250],
      travelY: [100, 180],
      durationSeconds: [0.8, 1.2],
      completionDelaySeconds: 0.1,
      sequenceLength: 12,
      trailCount: 8,
      trailLag: 0.04,
    });
    expect(GLOWING_MOON_SPEC).toEqual({
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
      ],
    });
    expect(CARD_RECIPE).toEqual({
      padding: 16,
      cornerRadius: 20,
      strokeWidth: 1,
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffsetY: 5,
    });
    expect(AURORA_SPEC).toEqual({
      blobCount: 5,
      alphaThreshold: 0.45,
      blur: 28,
    });

    const blobs = createAuroraBlobs(7);
    expect(blobs).toHaveLength(5);
    for (const blob of blobs) {
      expect(blob.speed).toBeGreaterThanOrEqual(0.18);
      expect(blob.speed).toBeLessThanOrEqual(0.32);
    }
  });
});
