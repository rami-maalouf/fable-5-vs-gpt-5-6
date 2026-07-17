import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useReducer, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AcquisitionView } from "@/components/scan/AcquisitionView";
import { AnalyzingOverlay } from "@/components/scan/AnalyzingOverlay";
import { CameraCaptureView } from "@/components/scan/CameraCaptureView";
import { ResultCard } from "@/components/scan/ResultCard";
import {
  INITIAL_SCAN_STATE,
  reduceScanState,
  type ScanSource,
  type ScanState,
} from "@/domain/scan-machine";
import type { Meal } from "@/domain/nutrition";
import { AnalyzePhotoError, analyzePreparedPhoto } from "@/services/analyze-photo";
import { prepareImageForAnalysis } from "@/services/prepare-image";
import { useDay } from "@/state/day-context";
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
  const [acquisitionMode, setAcquisitionMode] = useState<"choice" | "camera">("choice");
  const [preparationError, setPreparationError] = useState(false);
  const acceptedRequestIds = useRef(new Set<string>());
  const day = useDay();
  const theme = getNourishTheme(useColorScheme());
  const visiblePhotoUri = getVisiblePhotoUri(state);
  const isCameraAcquisition = state.status === "acquiring" && acquisitionMode === "camera";

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
    setAcquisitionMode("choice");

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

    await prepareSelectedPhoto({
      source: "library",
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    });
  }

  async function prepareSelectedPhoto({
    source,
    uri,
    width,
    height,
  }: {
    source: ScanSource;
    uri: string;
    width: number;
    height: number;
  }) {
    setPreparationError(false);
    setAcquisitionMode("choice");

    dispatch({
      type: "prepare_photo",
      source,
      uri,
    });

    try {
      const photo = await prepareImageForAnalysis({
        uri,
        width,
        height,
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

  function useCamera() {
    setPreparationError(false);
    setAcquisitionMode("camera");
  }

  function tryAnotherPhoto() {
    setPreparationError(false);
    setAcquisitionMode("choice");
    dispatch({ type: "try_another_photo" });
  }

  function retryAnalysis() {
    if (state.status !== "analysis_error" && state.status !== "network_error") {
      return;
    }

    dispatch({
      type: "retry_analysis",
      requestId: createRequestId(),
    });
  }

  function closeScan() {
    router.back();
  }

  function discardResult() {
    if (state.status === "result") {
      day.discardResult(state.requestId);
    }

    dispatch({ type: "discard" });
    router.back();
  }

  function acceptResult() {
    if (state.status !== "result" || acceptedRequestIds.current.has(state.requestId)) {
      return;
    }

    acceptedRequestIds.current.add(state.requestId);

    const meal: Meal = {
      ...state.result,
      id: state.requestId,
      thumbnailUri: state.photo.uri,
      loggedAt: Date.now(),
    };

    dispatch({ type: "accept_result" });
    day.acceptMeal(meal);
    dispatch({ type: "accept_completed" });
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

      {isCameraAcquisition ? (
        <CameraCaptureView
          theme={theme}
          onCapturedPhoto={(photo) => {
            void prepareSelectedPhoto({
              source: "camera",
              uri: photo.uri,
              width: photo.width,
              height: photo.height,
            });
          }}
          onChooseFromPhotos={chooseFromPhotos}
          onClose={closeScan}
        />
      ) : (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Close scan"
              accessibilityRole="button"
              onPress={closeScan}
              style={[
                styles.closeButton,
                {
                  backgroundColor: visiblePhotoUri
                    ? theme.colors.surface
                    : theme.colors.surfaceSubtle,
                },
              ]}
            >
              <Text style={[styles.closeText, { color: theme.colors.textPrimary }]}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            {state.status === "acquiring" && acquisitionMode === "choice" ? (
              <AcquisitionView
                preparationError={preparationError}
                theme={theme}
                onChooseFromPhotos={chooseFromPhotos}
                onUseCamera={useCamera}
              />
            ) : null}

            {state.status === "preparing" ? (
              <OverlayCard
                title="Preparing photo"
                body="Optimizing the JPEG for analysis."
                theme={theme}
              />
            ) : null}

            {state.status === "analyzing" ? <AnalyzingOverlay theme={theme} /> : null}

            {state.status === "not_food" ? (
              <FeedbackCard
                title="No food found"
                body="That photo does not look like a meal. Try another clear food photo."
                primaryLabel="Try another photo"
                onPrimary={tryAnotherPhoto}
                secondaryLabel="Close scan"
                onSecondary={closeScan}
                theme={theme}
              />
            ) : null}

            {state.status === "analysis_error" ? (
              <FeedbackCard
                title="Could not analyze photo"
                body="The estimate did not come back cleanly. Try again with the same prepared photo."
                primaryLabel="Try again"
                onPrimary={retryAnalysis}
                secondaryLabel="Close scan"
                onSecondary={closeScan}
                theme={theme}
              />
            ) : null}

            {state.status === "network_error" ? (
              <FeedbackCard
                title="Connection problem"
                body="Nourish could not reach the analyzer. Check the connection and try again."
                primaryLabel="Try again"
                onPrimary={retryAnalysis}
                secondaryLabel="Close scan"
                onSecondary={closeScan}
                theme={theme}
              />
            ) : null}

            {state.status === "result" || state.status === "accepting" ? (
              <ResultCard
                isAccepting={state.status === "accepting"}
                onAccept={acceptResult}
                onDiscard={discardResult}
                result={state.result}
                theme={theme}
              />
            ) : null}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

function FeedbackCard({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  theme,
  onPrimary,
  onSecondary,
}: {
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  theme: ReturnType<typeof getNourishTheme>;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.feedbackTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.feedbackBody, { color: theme.colors.textSecondary }]}>{body}</Text>

      <View style={styles.feedbackActions}>
        <Pressable
          accessibilityLabel={primaryLabel}
          accessibilityRole="button"
          onPress={onPrimary}
          style={[styles.feedbackPrimaryButton, { backgroundColor: theme.colors.accent }]}
        >
          <Text style={[styles.feedbackPrimaryText, { color: theme.colors.onAccent }]}>
            {primaryLabel}
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel={secondaryLabel}
          accessibilityRole="button"
          onPress={onSecondary}
          style={[
            styles.feedbackSecondaryButton,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.feedbackSecondaryText, { color: theme.colors.textPrimary }]}>
            {secondaryLabel}
          </Text>
        </Pressable>
      </View>
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
    paddingTop: nourishSpacing.eight,
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
  feedbackCard: {
    borderRadius: nourishRadii.large,
    padding: nourishSpacing.five,
    gap: nourishSpacing.four,
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  feedbackTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  feedbackBody: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  feedbackActions: {
    gap: nourishSpacing.three,
  },
  feedbackPrimaryButton: {
    minHeight: nourishTouchTargets.primary,
    borderRadius: nourishRadii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: nourishSpacing.four,
  },
  feedbackPrimaryText: {
    fontSize: 17,
    fontWeight: "900",
  },
  feedbackSecondaryButton: {
    minHeight: nourishTouchTargets.primary,
    borderRadius: nourishRadii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: nourishSpacing.four,
  },
  feedbackSecondaryText: {
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
