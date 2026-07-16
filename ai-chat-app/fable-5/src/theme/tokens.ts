import { PlatformColor, type ColorValue } from 'react-native';

// ios semantic colors so light/dark follows the system live with zero work.
// ios is the only target platform (spec), so PlatformColor is safe here.
export const colors = {
  background: PlatformColor('systemBackground') as ColorValue,
  secondaryBackground: PlatformColor('secondarySystemBackground') as ColorValue,
  label: PlatformColor('label') as ColorValue,
  secondaryLabel: PlatformColor('secondaryLabel') as ColorValue,
  tertiaryLabel: PlatformColor('tertiaryLabel') as ColorValue,
  separator: PlatformColor('separator') as ColorValue,
  // user message bubble - neutral fill, chatgpt convention
  bubble: PlatformColor('systemGray5') as ColorValue,
  fill: PlatformColor('systemGray6') as ColorValue,
  accent: PlatformColor('label') as ColorValue,
  destructive: PlatformColor('systemRed') as ColorValue,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  bubble: 20,
  control: 18,
  sheet: 12,
} as const;

// minimum ios touch target
export const minTouchTarget = 44;
