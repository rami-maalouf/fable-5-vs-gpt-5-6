import { themes } from '@/theme';

import {
  desaturateHexColor,
  desaturatedNightThemes,
  desaturateTheme,
  skiaGrayscaleMatrix,
} from './grayscale-theme-spike';

describe('grayscale while asleep spike', () => {
  it('converts hex colors to luma grayscale', () => {
    expect(desaturateHexColor('#ffffff')).toBe('#ffffff');
    expect(desaturateHexColor('#000000')).toBe('#000000');
    expect(desaturateHexColor('#00d4ff')).toBe('#aaaaaa');
    expect(desaturateHexColor('#ff6b35')).toBe('#878787');
  });

  it('generates desaturated variants for both night palettes', () => {
    expect(desaturatedNightThemes.twilight).toMatchObject({
      id: 'twilight',
      accent: '#aaaaaa',
      actionPrimary: '#909090',
      cardBackground: { hex: '#1b1b1b', opacity: themes.twilight.cardBackground.opacity },
    });
    expect(desaturatedNightThemes.amethyst).toMatchObject({
      id: 'amethyst',
      accent: '#616161',
      actionPrimary: '#616161',
      cardBackground: { hex: '#272727', opacity: themes.amethyst.cardBackground.opacity },
    });
  });

  it('preserves theme structure and alpha values', () => {
    expect(desaturateTheme(themes.sunset).actionSecondary.opacity).toBe(
      themes.sunset.actionSecondary.opacity,
    );
    expect(desaturateTheme(themes.sunset).backgroundGradient).toHaveLength(2);
  });

  it('defines a valid 4x5 skia grayscale matrix', () => {
    expect(skiaGrayscaleMatrix).toHaveLength(20);
    expect(skiaGrayscaleMatrix.slice(0, 5)).toEqual([0.2126, 0.7152, 0.0722, 0, 0]);
    expect(skiaGrayscaleMatrix.slice(15)).toEqual([0, 0, 0, 1, 0]);
  });
});
