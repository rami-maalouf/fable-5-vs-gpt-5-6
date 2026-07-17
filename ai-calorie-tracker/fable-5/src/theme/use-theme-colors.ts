// resolves the semantic color tokens for the live system appearance.
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColorTokens, type ColorTokens } from '@/theme/tokens';

export function useThemeColors(): ColorTokens {
  return getColorTokens(useColorScheme());
}
