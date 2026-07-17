import { Image } from 'expo-image';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useNourishTheme } from '@/theme/tokens';

type ScanPhotoStageProps = PropsWithChildren<{
  photoUri: string;
}>;

export function ScanPhotoStage({ children, photoUri }: ScanPhotoStageProps) {
  const theme = useNourishTheme();

  return (
    <View style={[styles.stage, { backgroundColor: theme.photoBackground }]}>
      <Image
        accessibilityLabel="Prepared meal photo"
        contentFit="cover"
        source={{ uri: photoUri }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.scrim, { backgroundColor: theme.photoScrim }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
  },
});
