// semantic design tokens for nourish. components consume these tokens and
// never hardcode raw hex values. pure module: no react imports.

export type ColorTokens = {
  // surfaces
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  // text
  textPrimary: string;
  textSecondary: string;
  // brand
  accent: string;
  onAccent: string;
  // progress
  ringTrack: string;
  over: string;
  // macros
  protein: string;
  carbs: string;
  fat: string;
  // full-bleed photo stage in the scan flow: identical in both themes so the
  // photo, scrim, and overlay text read the same day and night
  stageBackground: string;
  stageScrim: string;
  onStage: string;
};

// warm off-white light theme
export const lightColors: ColorTokens = {
  background: '#FAF6F1',
  surface: '#FFFFFF',
  surfaceMuted: '#F3ECE3',
  border: '#EDE4D8',
  textPrimary: '#2A2118',
  textSecondary: '#8B7F71',
  accent: '#E8654A',
  onAccent: '#FFFFFF',
  ringTrack: '#F3ECE3',
  over: '#B3402A',
  protein: '#D23B68',
  carbs: '#DE9A26',
  fat: '#7A6BF5',
  stageBackground: '#0D0B09',
  stageScrim: 'rgba(13, 11, 9, 0.62)',
  onStage: '#F5EFE9',
};

// near-black dark theme with the same hierarchy
export const darkColors: ColorTokens = {
  background: '#171310',
  surface: '#221C16',
  surfaceMuted: '#2C241C',
  border: '#332A21',
  textPrimary: '#F5EFE9',
  textSecondary: '#A6998A',
  accent: '#F0765C',
  onAccent: '#FFFFFF',
  ringTrack: '#2C241C',
  over: '#FF7A5C',
  protein: '#E85D87',
  carbs: '#F0B04A',
  fat: '#9A8CFF',
  stageBackground: '#0D0B09',
  stageScrim: 'rgba(13, 11, 9, 0.62)',
  onStage: '#F5EFE9',
};

// accepts any react-native color scheme name; everything except 'dark' maps
// to the light tokens, matching system behavior for 'unspecified'.
export function getColorTokens(scheme: string | null | undefined): ColorTokens {
  return scheme === 'dark' ? darkColors : lightColors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

// system font type scale; nutrition numbers add tabular numerals in place
export const typeScale = {
  display: { fontSize: 56, fontWeight: '800', letterSpacing: -1.5 },
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 0.2 },
  heading: { fontSize: 20, fontWeight: '700' },
  bodyStrong: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '400' },
} as const;

// motion durations in ms. settle sits inside the spec's 450-650 ms window for
// the ring and macro bars landing together after an accepted meal.
export const motion = {
  quick: 180,
  standard: 300,
  settle: 550,
} as const;

// dynamic type caps for layouts that cannot reflow indefinitely. body copy
// scales freely; oversized numerals, dense multi-column rows, and single-line
// pills cap so accessibility text sizes never clip or push content off-card.
export const fontScaleCap = {
  display: 1.3,
  dense: 1.4,
  pill: 1.5,
} as const;
