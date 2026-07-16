import {
  FADE_IN_SLIDE_SPEC,
  GLASS_PRESS_SPEC,
  GLOWING_MOON_SPEC,
  PICKER_ANIMATION_SPEC,
  SHOOTING_STAR_SPEC,
  createShootingStarSequence,
  twinkleOpacityAt,
} from '../src/components/common/visual-specs';

describe('animation parity', () => {
  it('keeps the Swift spring and breathing timings', () => {
    expect(FADE_IN_SLIDE_SPEC).toEqual({
      dampingRatio: 0.6,
      durationMilliseconds: 400,
      offsetY: 30,
    });
    expect(GLASS_PRESS_SPEC).toEqual({
      dampingRatio: 0.825,
      durationMilliseconds: 300,
      pressedScale: 0.96,
    });
    expect(PICKER_ANIMATION_SPEC).toEqual({
      knobDampingRatio: 0.7,
      knobDurationMilliseconds: 300,
      knobScale: 1.15,
      pulseDurationMilliseconds: 2_000,
    });
    expect(GLOWING_MOON_SPEC.legDurationMilliseconds).toBe(3_000);
    expect(GLOWING_MOON_SPEC.glowScale).toEqual({ resting: 1, glowing: 1.15 });
    expect(GLOWING_MOON_SPEC.blurScale).toEqual({ resting: 0.6, glowing: 1.5 });
  });

  it('starts every twinkle at rest and reaches each endpoint over a full leg', () => {
    const star = { delaySeconds: 0.7, initialOpacity: 0.8, twinkleDurationSeconds: 2 };

    expect(twinkleOpacityAt(star, 0)).toBe(0.3);
    expect(twinkleOpacityAt(star, 0.7)).toBe(0.3);
    expect(twinkleOpacityAt(star, 2.7)).toBeCloseTo(0.8);
    expect(twinkleOpacityAt(star, 4.7)).toBeCloseTo(0.3);
  });

  it('creates an irregular, deterministic shooting-star schedule inside Swift ranges', () => {
    const first = createShootingStarSequence(42, 12);
    const second = createShootingStarSequence(42, 12);

    expect(first).toEqual(second);
    expect(first.events).toHaveLength(12);
    expect(first.events[0].startSeconds).toBeGreaterThanOrEqual(2.05);
    expect(first.events[0].startSeconds).toBeLessThanOrEqual(4.05);
    for (const [index, event] of first.events.entries()) {
      expect(event.durationSeconds).toBeGreaterThanOrEqual(0.8);
      expect(event.durationSeconds).toBeLessThanOrEqual(1.2);
      expect(event.startX).toBeGreaterThanOrEqual(0.1);
      expect(event.startX).toBeLessThanOrEqual(0.5);
      expect(event.startY).toBeGreaterThanOrEqual(0);
      expect(event.startY).toBeLessThanOrEqual(0.25);
      expect(event.travelX).toBeGreaterThanOrEqual(150);
      expect(event.travelX).toBeLessThanOrEqual(250);
      expect(event.travelY).toBeGreaterThanOrEqual(100);
      expect(event.travelY).toBeLessThanOrEqual(180);
      if (index > 0) {
        const previous = first.events[index - 1];
        const gap = event.startSeconds - previous.startSeconds - previous.durationSeconds - 0.1;
        expect(gap).toBeGreaterThanOrEqual(4);
        expect(gap).toBeLessThanOrEqual(7);
      }
    }
    expect(first.loopDurationSeconds).toBeGreaterThan(
      first.events.at(-1)!.startSeconds + first.events.at(-1)!.durationSeconds,
    );
    expect(SHOOTING_STAR_SPEC.sequenceLength).toBe(12);
  });
});
