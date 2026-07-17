import { Image, StyleSheet } from "react-native";

type PhotoStageProps = {
  uri: string | null;
};

export function PhotoStage({ uri }: PhotoStageProps) {
  if (!uri) {
    return null;
  }

  return (
    <Image
      accessibilityLabel="Selected meal photo"
      resizeMode="cover"
      source={{ uri }}
      style={styles.photo}
      testID="scan-photo-stage-image"
    />
  );
}

const styles = StyleSheet.create({
  photo: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
});
