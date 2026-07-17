import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  initialWindowMetrics,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";

import { useNourishTheme } from "@/theme/tokens";

type AcquisitionViewProps = {
  busy: boolean;
  cameraBusy?: boolean;
  cameraMessage?: string;
  errorMessage?: string;
  onCamera: () => void;
  onClose: () => void;
  onPhotos: () => void;
};

export function AcquisitionView({
  busy,
  cameraBusy = false,
  cameraMessage,
  errorMessage,
  onCamera,
  onClose,
  onPhotos,
}: AcquisitionViewProps) {
  const theme = useNourishTheme();
  const reduceMotion = useReducedMotion();
  const topInset = Math.max(initialWindowMetrics?.insets.top ?? 0, 52);

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          paddingTop: topInset,
        },
      ]}
      testID="scanner-safe-area"
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Close scanner"
          accessibilityRole="button"
          hitSlop={6}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <View
            accessibilityElementsHidden
            style={[
              styles.closeLine,
              styles.closeLineLeft,
              { backgroundColor: theme.text },
            ]}
          />
          <View
            accessibilityElementsHidden
            style={[
              styles.closeLine,
              styles.closeLineRight,
              { backgroundColor: theme.text },
            ]}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.copy}>
          <Text
            accessibilityElementsHidden
            maxFontSizeMultiplier={1.4}
            style={[styles.eyebrow, { color: theme.coral }]}
          >
            FOOD SCAN
          </Text>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.5}
            style={[styles.title, { color: theme.text }]}
          >
            What are you eating?
          </Text>
          <Text
            maxFontSizeMultiplier={1.8}
            style={[styles.subtitle, { color: theme.textMuted }]}
          >
            Choose a clear photo with the whole meal in frame.
          </Text>
        </View>

        <View style={styles.choices}>
          <Pressable
            accessibilityLabel="Choose from Photos"
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={onPhotos}
            style={({ pressed }) => [
              styles.choice,
              {
                backgroundColor: pressed ? theme.primaryPressed : theme.primary,
                opacity: busy ? 0.7 : 1,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <View style={styles.choiceIcon}>
              <View
                style={[styles.photoMountain, { borderColor: theme.onAccent }]}
              />
              <View
                style={[styles.photoSun, { backgroundColor: theme.onAccent }]}
              />
            </View>
            <View style={styles.choiceCopy}>
              <Text
                maxFontSizeMultiplier={1.5}
                style={[styles.choiceTitle, { color: theme.onAccent }]}
              >
                Photos
              </Text>
              <Text
                maxFontSizeMultiplier={1.5}
                style={[styles.choiceSubtitle, { color: theme.onAccent }]}
              >
                Choose a meal photo
              </Text>
            </View>
            {busy &&
              (reduceMotion ? (
                <View
                  style={[
                    styles.statusMarker,
                    { backgroundColor: theme.onAccent },
                  ]}
                />
              ) : (
                <ActivityIndicator color={theme.onAccent} />
              ))}
          </Pressable>

          <Pressable
            accessibilityLabel="Use camera"
            accessibilityRole="button"
            accessibilityState={{ disabled: busy || cameraBusy }}
            disabled={busy || cameraBusy}
            onPress={onCamera}
            style={[
              styles.choice,
              styles.cameraChoice,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: busy || cameraBusy ? 0.65 : 1,
              },
            ]}
          >
            <View style={[styles.cameraIcon, { borderColor: theme.textMuted }]}>
              <View
                style={[styles.cameraLens, { borderColor: theme.textMuted }]}
              />
            </View>
            <View style={styles.choiceCopy}>
              <Text
                maxFontSizeMultiplier={1.5}
                style={[styles.choiceTitle, { color: theme.text }]}
              >
                Camera
              </Text>
              <Text
                maxFontSizeMultiplier={1.5}
                style={[styles.choiceSubtitle, { color: theme.textMuted }]}
              >
                {cameraBusy ? "Requesting access" : "Open rear camera"}
              </Text>
            </View>
            {cameraBusy &&
              (reduceMotion ? (
                <View
                  style={[
                    styles.statusMarker,
                    { backgroundColor: theme.coral },
                  ]}
                />
              ) : (
                <ActivityIndicator color={theme.coral} />
              ))}
          </Pressable>
        </View>

        {!!cameraMessage && (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            maxFontSizeMultiplier={1.8}
            style={[styles.error, { color: theme.text }]}
          >
            {cameraMessage}
          </Text>
        )}
        {!!errorMessage && (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            maxFontSizeMultiplier={1.8}
            style={[styles.error, { color: theme.overGoal }]}
          >
            {errorMessage}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    alignItems: "flex-end",
    paddingTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  closeLine: {
    borderRadius: 2,
    height: 2,
    position: "absolute",
    width: 18,
  },
  closeLineLeft: {
    transform: [{ rotate: "45deg" }],
  },
  closeLineRight: {
    transform: [{ rotate: "-45deg" }],
  },
  copy: {
    marginTop: 54,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -1.4,
    lineHeight: 44,
    marginTop: 7,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 310,
  },
  choices: {
    gap: 14,
    marginTop: 44,
  },
  choice: {
    alignItems: "center",
    borderRadius: 24,
    flexDirection: "row",
    minHeight: 92,
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  cameraChoice: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0,
  },
  choiceIcon: {
    height: 34,
    marginRight: 16,
    position: "relative",
    width: 38,
  },
  photoMountain: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    height: 22,
    left: 4,
    position: "absolute",
    top: 9,
    transform: [{ rotate: "-45deg" }],
    width: 22,
  },
  photoSun: {
    borderRadius: 4,
    height: 8,
    position: "absolute",
    right: 3,
    top: 2,
    width: 8,
  },
  cameraIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 2,
    height: 29,
    justifyContent: "center",
    marginRight: 18,
    width: 38,
  },
  cameraLens: {
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  choiceCopy: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  choiceSubtitle: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.9,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 20,
    textAlign: "center",
  },
  statusMarker: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
