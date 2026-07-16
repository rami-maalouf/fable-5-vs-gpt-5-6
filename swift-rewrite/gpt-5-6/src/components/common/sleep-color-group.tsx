import { ColorMatrix, Group } from '@shopify/react-native-skia';
import type { PropsWithChildren } from 'react';

import { LUMINANCE_COLOR_MATRIX } from '@/theme/grayscale';
import { useTheme } from '@/theme/ThemeProvider';

export function SleepColorGroup({ children }: PropsWithChildren) {
  const { isSleeping } = useTheme();
  return (
    <Group>
      {isSleeping ? <ColorMatrix matrix={LUMINANCE_COLOR_MATRIX} /> : null}
      {children}
    </Group>
  );
}
