// ports: twilight shared sf symbol rendering

import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export function PlatformSymbol({
  androidName,
  color,
  size,
  symbol,
}: {
  androidName: IoniconName;
  color: string;
  size: number;
  symbol: string;
}) {
  if (Platform.OS !== 'ios') {
    return <Ionicons color={color} name={androidName} size={size} />;
  }

  return (
    <Image
      source={`sf:${symbol}`}
      style={{ color, fontSize: size, height: size + 2, width: size + 2 }}
    />
  );
}
