import { cardRecipe, glowingMoonLayers, starfieldConfig } from './chrome-tokens';

describe('screen chrome tokens', () => {
  it('matches the spec starfield, moon, and card recipe constants', () => {
    expect(starfieldConfig.stars).toHaveLength(40);
    expect(starfieldConfig.stars.every((star) => star.size >= 1.5 && star.size <= 3.5)).toBe(true);
    expect(starfieldConfig.stars.every((star) => star.opacity >= 0.3 && star.opacity <= 0.8)).toBe(true);
    expect(starfieldConfig.shootingStarTrailCount).toBe(8);
    expect(glowingMoonLayers).toEqual([
      { radius: 40, opacity: 0.15 },
      { radius: 25, opacity: 0.25 },
      { radius: 12, opacity: 0.4 },
    ]);
    expect(cardRecipe).toEqual({
      padding: 16,
      radius: 20,
      strokeStartOpacity: 0.4,
      strokeEndOpacity: 0.1,
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowYOffset: 5,
    });
  });
});
