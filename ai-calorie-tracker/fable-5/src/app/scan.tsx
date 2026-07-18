// full-screen scan modal. owns the scan state machine and renders purely by
// screen status; every transition goes through scanReducer events.
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AcquisitionView } from '@/components/scan/AcquisitionView';
import { AnalyzingOverlay } from '@/components/scan/AnalyzingOverlay';
import { CameraCapture } from '@/components/scan/CameraView';
import { ErrorCard } from '@/components/scan/ErrorCard';
import { ResultCard } from '@/components/scan/ResultCard';
import { ScanPhotoStage } from '@/components/scan/ScanPhotoStage';
import { createMeal } from '@/domain/nutrition';
import { INITIAL_SCAN_STATE, scanReducer } from '@/domain/scan-machine';
import { analyzePhoto } from '@/services/analyze-photo';
import { prepareImage } from '@/services/prepare-image';
import type { SourceImage } from '@/services/prepare-image';
import { useDay } from '@/state/day-context';
import { fontScaleCap, radius, spacing, typeScale } from '@/theme/tokens';
import { useThemeColors } from '@/theme/use-theme-colors';

const PREPARATION_NOTICE =
  'That photo could not be read. Try another one.';

// each scan modal session takes a fresh token so meal ids stay unique across
// separate scans in one day; request ids restart per session, so an id built
// from the request id alone would collide and day state would silently drop
// a later meal. within a session the request id still keeps duplicate accepts
// of the same result idempotent.
let scanSessionCounter = 0;

export default function ScanScreen() {
  const [state, dispatch] = useReducer(scanReducer, INITIAL_SCAN_STATE);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { acceptMeal } = useDay();
  // presentation-only flags; the machine still owns the flow
  const [prepFailed, setPrepFailed] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  // the uri the user saw first for the current photo (raw library asset or
  // frozen camera frame). the photo stage keeps this exact uri mounted under
  // every later state so the prepared jpeg can crossfade in with no swap.
  const [stageDisplayUri, setStageDisplayUri] = useState<string | null>(null);
  // stable per-mount session token for meal ids
  const [scanSession] = useState(() => {
    scanSessionCounter += 1;
    return scanSessionCounter;
  });
  const pickerOpenRef = useRef(false);
  // exactly one request per request id; the controller cancels the active
  // request on discard and unmount
  const startedRequestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  // blocks same-frame double taps from repeating the accept haptic
  const acceptHandledRef = useRef(false);

  const { screen } = state;

  // discard closes through the machine; accept closes once the accepted
  // meal has been committed to day state, so the dismissal is requested
  // only after the meal is added and the widget snapshot effect runs in
  // the same commit
  const shouldClose =
    screen.status === 'closed' ||
    (screen.status === 'result' && screen.accepted);
  useEffect(() => {
    if (shouldClose) {
      router.back();
    }
  }, [shouldClose, router]);

  // entering analyzing starts one real analysis for that request id. the
  // reducer already ignores completions whose request id is stale.
  useEffect(() => {
    if (screen.status !== 'analyzing') {
      return;
    }
    const { photo, requestId } = screen;
    if (startedRequestIdRef.current >= requestId) {
      return;
    }
    startedRequestIdRef.current = requestId;
    // defensively cancel anything still in flight before the replacement
    // starts; the reducer serializes requests, so this only fires if an old
    // controller was somehow left behind
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    void analyzePhoto(photo.base64, controller.signal).then((outcome) => {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
      switch (outcome.kind) {
        case 'success':
          dispatch({ type: 'analysis_succeeded', requestId, result: outcome.result });
          break;
        case 'not_food':
          dispatch({ type: 'analysis_not_food', requestId });
          break;
        case 'failure':
          dispatch({ type: 'analysis_failed', requestId, reason: outcome.reason });
          break;
        case 'aborted':
          // the caller cancelled; nothing may change the screen
          break;
      }
    });
  }, [screen]);

  // abort any in-flight analysis when the modal unmounts
  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [],
  );

  const handleClose = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    dispatch({ type: 'discard' });
  }, []);

  const handleAccept = useCallback(() => {
    if (
      screen.status !== 'result' ||
      screen.accepted ||
      acceptHandledRef.current
    ) {
      return;
    }
    acceptHandledRef.current = true;
    // success haptic on the first accept press only
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // lock the button, then log exactly one meal keyed by the request id so
    // duplicate accepts of the same result can never double-log; the close
    // effect above dismisses the modal after this commit
    dispatch({ type: 'accept' });
    acceptMeal(
      createMeal(
        screen.result,
        `scan-${scanSession}-${screen.requestId}`,
        screen.photo.uri,
        Date.now(),
      ),
    );
  }, [screen, acceptMeal, scanSession]);

  // one shared preparation path: captured and selected photos dispatch the
  // same events and use the same downstream analysis and result logic
  const runPreparation = useCallback(async (source: SourceImage) => {
    setPrepFailed(false);
    setStageDisplayUri(source.uri);
    dispatch({ type: 'start_preparing', displayUri: source.uri });
    try {
      const photo = await prepareImage(source);
      dispatch({ type: 'photo_prepared', photo });
    } catch {
      setPrepFailed(true);
      dispatch({ type: 'preparation_failed' });
    } finally {
      // the camera stays mounted through preparing so its frozen frame
      // covers the handoff; release it once the machine has moved on
      setCameraOpen(false);
    }
  }, []);

  const handleCameraCapture = useCallback(
    (source: SourceImage) => {
      void runPreparation(source);
    },
    [runPreparation],
  );

  const handleChooseLibrary = useCallback(async () => {
    // guard against double taps launching two pickers
    if (pickerOpenRef.current) {
      return;
    }
    pickerOpenRef.current = true;
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });
      if (picked.canceled) {
        // cancellation returns to acquisition with no error
        return;
      }
      const asset = picked.assets[0];
      // a library pick may come from the camera's denied fallback; the
      // library photo should show the regular preparing stage, not the camera
      setCameraOpen(false);
      await runPreparation({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
    } finally {
      pickerOpenRef.current = false;
    }
  }, [runPreparation]);

  // the camera renders while acquiring and keeps rendering through preparing
  // a captured photo, so the frozen frame stays over the preview with no
  // blank frame before the prepared-photo stage takes over at analyzing
  // the camera and photo stage are always dark in both themes, so the status
  // bar switches to light content there; acquisition keeps the themed auto
  // style from the root layout, which the stack restores on unmount
  const stageStatusBar = <StatusBar style="light" animated />;

  if (
    cameraOpen &&
    (screen.status === 'acquiring' || screen.status === 'preparing')
  ) {
    return (
      <>
        {stageStatusBar}
        <CameraCapture
          onCapture={handleCameraCapture}
          onChooseLibrary={handleChooseLibrary}
          onClose={() => setCameraOpen(false)}
        />
      </>
    );
  }

  if (screen.status === 'acquiring') {
    return (
      <AcquisitionView
        onChooseCamera={() => setCameraOpen(true)}
        onChooseLibrary={handleChooseLibrary}
        onClose={handleClose}
        notice={prepFailed ? PREPARATION_NOTICE : null}
      />
    );
  }

  if (screen.status === 'closed') {
    // the effect above dismisses the modal; render a quiet frame meanwhile
    return (
      <View
        style={[styles.stage, { backgroundColor: colors.stageBackground }]}
      >
        {stageStatusBar}
      </View>
    );
  }

  // every remaining status keeps one photo stage mounted full screen with
  // overlays layered above it. the base layer always shows the original
  // display uri; the prepared jpeg crossfades in above it once it exists,
  // so no state change ever swaps or blanks the visible image.
  const displayUri =
    screen.status === 'preparing'
      ? screen.displayUri
      : (stageDisplayUri ?? screen.photo.uri);
  const preparedUri = screen.status === 'preparing' ? null : screen.photo.uri;
  const noticeLabel = screen.status === 'preparing' ? 'Preparing photo' : null;

  return (
    <View style={[styles.stage, { backgroundColor: colors.stageBackground }]}>
      {stageStatusBar}
      <ScanPhotoStage displayUri={displayUri} preparedUri={preparedUri} />
      {noticeLabel ? (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.overlayArea, { bottom: insets.bottom + spacing.xxxl }]}
        >
          <View style={[styles.overlayPill, { backgroundColor: colors.stageScrim }]}>
            {screen.status === 'preparing' ? (
              <ActivityIndicator size="small" color={colors.onStage} />
            ) : null}
            <Text
              maxFontSizeMultiplier={fontScaleCap.pill}
              style={[styles.overlayLabel, { color: colors.onStage }]}
            >
              {noticeLabel}
            </Text>
          </View>
        </View>
      ) : null}
      {screen.status === 'analyzing' ? <AnalyzingOverlay /> : null}
      {screen.status === 'not_food' ? (
        <ErrorCard
          variant="not_food"
          onPrimaryAction={() => dispatch({ type: 'try_another_photo' })}
          onDiscard={handleClose}
        />
      ) : null}
      {screen.status === 'failed' ? (
        <ErrorCard
          variant={screen.reason}
          onPrimaryAction={() => dispatch({ type: 'retry_analysis' })}
          onDiscard={handleClose}
        />
      ) : null}
      {screen.status === 'result' ? (
        <ResultCard
          result={screen.result}
          accepted={screen.accepted}
          onAccept={handleAccept}
          onDiscard={handleClose}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Discard photo and close"
        onPress={handleClose}
        hitSlop={8}
        style={({ pressed }) => [
          styles.close,
          {
            top: insets.top + spacing.sm,
            backgroundColor: colors.stageScrim,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d="M6 6 L18 18 M18 6 L6 18"
            stroke={colors.onStage}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
  },
  close: {
    position: 'absolute',
    left: spacing.xl,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  overlayLabel: {
    ...typeScale.bodyStrong,
  },
});
