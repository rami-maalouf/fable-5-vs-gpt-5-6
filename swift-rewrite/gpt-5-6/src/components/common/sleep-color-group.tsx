import { ColorMatrix, Group } from '@shopify/react-native-skia';
import type { PropsWithChildren } from 'react';

import { LUMINANCE_COLOR_MATRIX } from '@/theme/grayscale';

interface SleepColorGroupProps extends PropsWithChildren {
  isSleeping: boolean;
}

export function SleepColorGroup({ children, isSleeping }: SleepColorGroupProps) {
  return (
    <Group>
      {isSleeping ? <ColorMatrix matrix={LUMINANCE_COLOR_MATRIX} /> : null}
      {children}
    </Group>
  );
}
