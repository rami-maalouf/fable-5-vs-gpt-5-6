export type StarToken = {
  x: number;
  y: number;
  size: number;
  opacity: number;
};

function pseudoRandom(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export const starfieldConfig = {
  stars: Array.from({ length: 40 }, (_, index) => ({
    x: pseudoRandom(index, 1),
    y: pseudoRandom(index, 2),
    size: 1.5 + pseudoRandom(index, 3) * 2,
    opacity: 0.3 + pseudoRandom(index, 4) * 0.5,
  })) satisfies StarToken[],
  shootingStarTrailCount: 8,
  shootingStar: {
    startX: 0.32,
    startY: 0.12,
    travelX: 210,
    travelY: 140,
  },
};

export const glowingMoonLayers = [
  { radius: 40, opacity: 0.15 },
  { radius: 25, opacity: 0.25 },
  { radius: 12, opacity: 0.4 },
] as const;

export const cardRecipe = {
  padding: 16,
  radius: 20,
  strokeStartOpacity: 0.4,
  strokeEndOpacity: 0.1,
  shadowOpacity: 0.1,
  shadowRadius: 10,
  shadowYOffset: 5,
} as const;

export const cardBackgroundRecipe = {
  radius: 24,
  materialOpacity: 0.7,
  strokeOpacity: 0.3,
  spotlightOpacity: 0.5,
  spotlightBlur: 15,
} as const;
