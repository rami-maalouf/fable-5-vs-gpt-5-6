import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AcquisitionView } from "@/components/scan/AcquisitionView";
import { AnalyzingOverlay } from "@/components/scan/AnalyzingOverlay";
import { CameraCaptureView } from "@/components/scan/CameraCaptureView";
import { ErrorCard } from "@/components/scan/ErrorCard";
import { PhotoStage } from "@/components/scan/PhotoStage";
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
import { useReducedMotion } from "@/state/reduced-motion";
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
    if (canDiscardScanState(state)) {
      dispatch({ type: "discard" });
    }

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
      <PhotoStage uri={visiblePhotoUri} />

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
              <OverlayTransition transitionKey="preparing">
                <OverlayCard
                  title="Preparing photo"
                  body="Optimizing the JPEG for analysis."
                  theme={theme}
                />
              </OverlayTransition>
            ) : null}

            {state.status === "analyzing" ? (
              <OverlayTransition transitionKey="analyzing">
                <AnalyzingOverlay theme={theme} />
              </OverlayTransition>
            ) : null}

            {state.status === "not_food" ? (
              <OverlayTransition transitionKey="not_food">
                <ErrorCard
                  title="No food found"
                  body="That photo does not look like a meal. Try another clear food photo."
                  primaryLabel="Try another photo"
                  onPrimary={tryAnotherPhoto}
                  secondaryLabel="Close scan"
                  onSecondary={closeScan}
                  theme={theme}
                />
              </OverlayTransition>
            ) : null}

            {state.status === "analysis_error" ? (
              <OverlayTransition transitionKey="analysis_error">
                <ErrorCard
                  title="Could not analyze photo"
                  body="The estimate did not come back cleanly. Try again with the same prepared photo."
                  primaryLabel="Retry analysis"
                  onPrimary={retryAnalysis}
                  secondaryLabel="Close scan"
                  onSecondary={closeScan}
                  theme={theme}
                />
              </OverlayTransition>
            ) : null}

            {state.status === "network_error" ? (
              <OverlayTransition transitionKey="network_error">
                <ErrorCard
                  title="Connection problem"
                  body="Nourish could not reach the analyzer. Check the connection and try again."
                  primaryLabel="Retry analysis"
                  onPrimary={retryAnalysis}
                  secondaryLabel="Close scan"
                  onSecondary={closeScan}
                  theme={theme}
                />
              </OverlayTransition>
            ) : null}

            {state.status === "result" || state.status === "accepting" ? (
              <OverlayTransition transitionKey="result">
                <ResultCard
                  isAccepting={state.status === "accepting"}
                  onAccept={acceptResult}
                  onDiscard={discardResult}
                  result={state.result}
                  theme={theme}
                />
              </OverlayTransition>
            ) : null}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

function OverlayTransition({
  children,
  transitionKey,
}: {
  children: ReactNode;
  transitionKey: string;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return undefined;
    }

    progress.setValue(0);

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [progress, reduceMotion, transitionKey]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: reduceMotion ? [0, 0] : [8, 0],
  });

  return (
    <Animated.View style={{ opacity: progress, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
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
    <View
      accessibilityLabel={`${title}. ${body}`}
      accessibilityLiveRegion="polite"
      accessibilityRole="summary"
      style={[styles.overlayCard, { backgroundColor: theme.colors.surface }]}
    >
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

function canDiscardScanState(state: ScanState): boolean {
  return (
    state.status === "result" ||
    state.status === "not_food" ||
    state.status === "analysis_error" ||
    state.status === "network_error"
  );
}

function createRequestId(): string {
  return `scan-${Date.now()}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "flex-end",
    paddingHorizontal: nourishSpacing.five,
    paddingTop: nourishSpacing.eight,
    zIndex: 1,
  },
  closeButton: {
    minWidth: nourishTouchTargets.minimum,
    minHeight: nourishTouchTargets.minimum,
    borderRadius: nourishRadii.pill,
    paddingHorizontal: nourishSpacing.four,
    paddingVertical: nourishSpacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: nourishSpacing.five,
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
    lineHeight: 31,
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
