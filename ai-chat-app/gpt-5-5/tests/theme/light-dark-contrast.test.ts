import { describe, expect, it } from '@jest/globals';

import { novaColorSchemes } from '@/theme';

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');

  return {
    b: Number.parseInt(value.slice(4, 6), 16) / 255,
    g: Number.parseInt(value.slice(2, 4), 16) / 255,
    r: Number.parseInt(value.slice(0, 2), 16) / 255,
  };
}

function channelToLinear(value: number) {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const { b, g, r } = hexToRgb(hex);

  return (0.2126 * channelToLinear(r))
    + (0.7152 * channelToLinear(g))
    + (0.0722 * channelToLinear(b));
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('novaColorSchemes', () => {
  it('keeps user bubble text readable in light and dark modes', () => {
    expect(contrastRatio(
      novaColorSchemes.light.accentText,
      novaColorSchemes.light.accent
    )).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(
      novaColorSchemes.dark.accentText,
      novaColorSchemes.dark.accent
    )).toBeGreaterThanOrEqual(4.5);
  });
});
