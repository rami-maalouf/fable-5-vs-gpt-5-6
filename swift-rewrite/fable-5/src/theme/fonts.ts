// sf pro rounded is used selectively on large numerics in the original
// (.rounded design). ios exposes it through the system's rounded ui font
// family name; android falls back to the default sans.
import { Platform, type TextStyle } from 'react-native';

export function roundedFont(weight: TextStyle['fontWeight']): TextStyle {
  if (Platform.OS === 'ios') {
    const suffix =
      weight === '700' || weight === 'bold'
        ? 'Bold'
        : weight === '600'
          ? 'Semibold'
          : 'Medium';
    return { fontFamily: `.AppleSystemUIFontRounded-${suffix}`, fontWeight: weight };
  }
  return { fontWeight: weight };
}
