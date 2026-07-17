import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useReducer, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnalyzingOverlay } from "@/components/scan/AnalyzingOverlay";
import { ResultCard } from "@/components/scan/ResultCard";
import {
  INITIAL_SCAN_STATE,
  reduceScanState,
  type ScanState,
} from "@/domain/scan-machine";
import { AnalyzePhotoError, analyzePreparedPhoto } from "@/services/analyze-photo";
import { prepareImageForAnalysis } from "@/services/prepare-image";
import {
  getNourishTheme,
  nourishRadii,
  nourishSpacing,
  nourishTouchTargets,
} from "@/theme/tokens";

export default function ScanScreen() {
  const [state, dispatch] = useReducer(
    reduceScanState,
    reduceScanState(INITIAL_SCAN_STATE, { type: "open_scan" }),
  );
  const [preparationError, setPreparationError] = useState(false);
  const theme = getNourishTheme(useColorScheme());
  const visiblePhotoUri = getVisiblePhotoUri(state);

  useEffect(() => {
    if (state.status !== "analyzing") {
      return undefined;
    }

    const controller = new AbortController();
    const requestId = state.requestId;

    analyzePreparedPhoto(state.photo, { signal: controller.signal })
      .then((analysis) => {
        if (controller.signal.aborted) {
          return;
        }

        if (analysis.type === "not_food") {
          dispatch({ type: "analysis_not_food", requestId });
          return;
        }

        dispatch({
          type: "analysis_succeeded",
          requestId,
          result: analysis.result,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        dispatch({
          type: "analysis_failed",
          requestId,
          reason: error instanceof AnalyzePhotoError ? error.reason : "network",
        });
      });

    return () => {
      controller.abort();
    };
  }, [state]);

  function chooseFromPhotos() {
    void chooseFromPhotosAsync();
  }

  async function chooseFromPhotosAsync() {
    setPreparationError(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];

    dispatch({
      type: "prepare_photo",
      source: "library",
      uri: asset.uri,
    });

    try {
      const photo = await prepareImageForAnalysis({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });

      dispatch({
        type: "start_analysis",
        photo,
        requestId: createRequestId(),
      });
    } catch {
      setPreparationError(true);
      dispatch({ type: "preparation_failed" });
    }
  }

  function closeScan() {
    router.back();
  }

  function discardResult() {
    dispatch({ type: "discard" });
    router.back();
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {visiblePhotoUri ? (
        <Image
          accessibilityLabel="Selected meal photo"
          resizeMode="cover"
          source={{ uri: visiblePhotoUri }}
          style={styles.photo}
        />
      ) : null}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Close scan"
            accessibilityRole="button"
            onPress={closeScan}
            style={[
              styles.closeButton,
              {
                backgroundColor: visiblePhotoUri ? theme.colors.surface : theme.colors.surfaceSubtle,
              },
            ]}
          >
            <Text style={[styles.closeText, { color: theme.colors.textPrimary }]}>Close</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {state.status === "acquiring" ? (
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Scan your meal</Text>
              <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
                Choose a clear food photo. Nourish will prepare it before sending it for analysis.
              </Text>

              {preparationError ? (
                <Text style={[styles.error, { color: theme.colors.danger }]}>
                  Could not prepare that photo.
                </Text>
              ) : null}

              <View style={styles.actionStack}>
                <Pressable
                  accessibilityLabel="Choose from Photos"
                  accessibilityRole="button"
                  onPress={chooseFromPhotos}
                  style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
                >
                  <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>
                    Choose from Photos
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Use camera"
                  accessibilityRole="button"
                  disabled
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
                    Camera next
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {state.status === "preparing" ? (
            <OverlayCard title="Preparing photo" body="Optimizing the JPEG for analysis." theme={theme} />
          ) : null}

          {state.status === "analyzing" ? (
            <AnalyzingOverlay theme={theme} />
          ) : null}

          {state.status === "result" || state.status === "accepting" ? (
            <ResultCard
              isAccepting={state.status === "accepting"}
              onAccept={() => dispatch({ type: "accept_result" })}
              onDiscard={discardResult}
              result={state.result}
              theme={theme}
            />
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function OverlayCard({
  title,
  body,
  theme,
}: {
  title: string;
  body: string;
  theme: ReturnType<typeof getNourishTheme>;
}) {
  return (
    <View style={[styles.overlayCard, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.overlayTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.overlayBody, { color: theme.colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

function getVisiblePhotoUri(state: ScanState): string | null {
  if (state.status === "preparing") {
    return state.uri;
  }

  if (
    state.status === "analyzing" ||
    state.status === "result" ||
    state.status === "accepting" ||
    state.status === "not_food" ||
    state.status === "analysis_error" ||
    state.status === "network_error"
  ) {
    return state.photo.uri;
  }

  return null;
}

function createRequestId(): string {
  return `scan-${Date.now()}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  photo: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "flex-end",
    paddingHorizontal: nourishSpacing.five,
    paddingTop: nourishSpacing.three,
  },
  closeButton: {
    minWidth: nourishTouchTargets.minimum,
    minHeight: nourishTouchTargets.minimum,
    borderRadius: nourishRadii.pill,
    paddingHorizontal: nourishSpacing.four,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 15,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: nourishSpacing.five,
  },
  card: {
    borderRadius: nourishRadii.large,
    padding: nourishSpacing.five,
    gap: nourishSpacing.four,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  error: {
    fontSize: 14,
    fontWeight: "800",
  },
  actionStack: {
    gap: nourishSpacing.three,
  },
  primaryButton: {
    minHeight: nourishTouchTargets.primary,
    borderRadius: nourishRadii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: nourishSpacing.four,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: nourishTouchTargets.primary,
    borderRadius: nourishRadii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: nourishSpacing.four,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  overlayCard: {
    borderRadius: nourishRadii.large,
    padding: nourishSpacing.five,
    gap: nourishSpacing.three,
    alignItems: "center",
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  overlayTitle: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  overlayBody: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
});
