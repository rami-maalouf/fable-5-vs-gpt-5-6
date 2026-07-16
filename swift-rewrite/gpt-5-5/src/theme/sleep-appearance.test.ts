import { desaturateHexColor, desaturateTheme, skiaGrayscaleMatrix } from './sleep-appearance';
import { themes } from './palettes';

describe('sleep appearance', () => {
  it('desaturates hex colors with luminance weights from the spike decision', () => {
    expect(desaturateHexColor('#00d4ff')).toBe('#aaaaaa');
    expect(desaturateHexColor('#ff6b35')).toBe('#878787');
  });

  it('desaturates every theme color slot without changing theme identity', () => {
    expect(desaturateTheme(themes.twilight)).toMatchObject({
      id: 'twilight',
      backgroundGradient: ['#131313', '#262626'],
      accent: '#aaaaaa',
      warning: '#878787',
    });
  });

  it('exports a Skia grayscale matrix for canvas content', () => {
    expect(skiaGrayscaleMatrix).toHaveLength(20);
    expect(skiaGrayscaleMatrix.slice(0, 5)).toEqual([0.2126, 0.7152, 0.0722, 0, 0]);
  });
});
