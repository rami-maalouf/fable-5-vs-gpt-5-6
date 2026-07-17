import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { useNourishTheme } from "@/theme/tokens";

type ScanPhotoStageProps = PropsWithChildren<{
  photoUri: string;
}>;

export function ScanPhotoStage({ children, photoUri }: ScanPhotoStageProps) {
  const theme = useNourishTheme();

  return (
    <View style={[styles.stage, { backgroundColor: theme.photoBackground }]}>
      <StatusBar animated style="light" />
      <Image
        accessibilityElementsHidden
        accessible={false}
        cachePolicy="memory-disk"
        contentFit="cover"
        source={{ uri: photoUri }}
        style={StyleSheet.absoluteFill}
        testID="prepared-meal-photo"
        transition={0}
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
