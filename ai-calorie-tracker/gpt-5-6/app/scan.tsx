import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AcquisitionView } from '@/components/scan/AcquisitionView';
import { AnalyzingOverlay } from '@/components/scan/AnalyzingOverlay';
import { CameraCaptureView } from '@/components/scan/CameraView';
import { ResultCard } from '@/components/scan/ResultCard';
import { ScanPhotoStage } from '@/components/scan/ScanPhotoStage';
import {
  initialScanState,
  scanReducer,
  type PreparedPhoto,
  type ScanState,
} from '@/domain/scan-machine';
import { AnalyzePhotoError, analyzePhoto } from '@/services/analyze-photo';
import {
  pickLibraryImage,
  prepareImage,
  type ImageSource,
} from '@/services/prepare-image';
import { useDay } from '@/state/day-context';
import { useNourishTheme } from '@/theme/tokens';

const initialAcquisitionState = scanReducer(initialScanState, {
  type: 'open',
  source: 'library',
});

type ScanScreenProps = {
  initialState?: ScanState;
};

function ErrorOverlay({
  onDiscard,
}: {
  onDiscard: () => void;
}) {
  const theme = useNourishTheme();

  return (
    <SafeAreaView style={styles.errorSafeArea}>
      <View style={[styles.errorCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.errorTitle, { color: theme.text }]}>Analysis paused</Text>
        <Text style={[styles.errorBody, { color: theme.textMuted }]}>
          We could not finish this estimate.
        </Text>
        <Pressable
          accessibilityLabel="Discard estimate"
          accessibilityRole="button"
          onPress={onDiscard}
          style={[styles.errorAction, { borderColor: theme.border }]}>
          <Text style={[styles.errorActionLabel, { color: theme.text }]}>Discard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getPreparedPhoto(state: ScanState): PreparedPhoto | null {
  if (
    state.status === 'analyzing' ||
    state.status === 'result' ||
    state.status === 'error' ||
    state.status === 'accepting'
  ) {
    return state.photo;
  }

  return null;
}

export function ScanScreen({
  initialState = initialAcquisitionState,
}: ScanScreenProps) {
  const [state, dispatch] = useReducer(scanReducer, initialState);
  const [preparationError, setPreparationError] = useState<string>();
  const [cameraMessage, setCameraMessage] = useState<string>();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const { acceptMeal } = useDay();
  const requestSequence = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const acceptLocked = useRef(false);
  const cameraRequestLocked = useRef(false);

  useEffect(() => {
    return () => activeRequest.current?.abort();
  }, []);

  const closeScanner = useCallback(() => {
    activeRequest.current?.abort();
    dispatch({ type: 'discard' });
    router.back();
  }, []);

  const runAnalysis = useCallback(
    async (photo: PreparedPhoto, requestId: string) => {
      const controller = new AbortController();
      activeRequest.current = controller;

      try {
        const result = await analyzePhoto(photo.base64, controller.signal);
        dispatch({ type: 'analysis-succeeded', requestId, result });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const kind =
          error instanceof AnalyzePhotoError ? error.kind : 'analysis';
        dispatch({ type: 'analysis-failed', requestId, kind });
      } finally {
        if (activeRequest.current === controller) {
          activeRequest.current = null;
        }
      }
    },
    [],
  );

  const processImageSource = useCallback(async (source: ImageSource) => {
    try {
      requestSequence.current += 1;
      const requestId = `photo-${Date.now()}-${requestSequence.current}`;
      dispatch({
        type: 'photo-selected',
        requestId,
        sourceUri: source.uri,
      });

      const photo = await prepareImage(source);
      dispatch({ type: 'photo-prepared', requestId, photo });
      void runAnalysis(photo, requestId);
    } catch {
      dispatch({ type: 'discard' });
      dispatch({ type: 'open', source: 'library' });
      setPreparationError('We could not prepare that photo. Please choose another.');
    }
  }, [runAnalysis]);

  const choosePhoto = useCallback(async () => {
    if (state.status !== 'acquiring' && state.status !== 'idle') {
      return;
    }

    setPreparationError(undefined);
    setCameraMessage(undefined);
    setCameraVisible(false);

    try {
      const source = await pickLibraryImage();
      if (source) {
        await processImageSource(source);
      }
    } catch {
      setPreparationError('We could not open Photos. Please try again.');
    }
  }, [processImageSource, state.status]);

  const openCamera = useCallback(async () => {
    if (
      (state.status !== 'acquiring' && state.status !== 'idle') ||
      cameraRequestLocked.current
    ) {
      return;
    }

    cameraRequestLocked.current = true;
    setCameraBusy(true);
    setCameraMessage(undefined);
    setPreparationError(undefined);

    try {
      if (
        cameraPermission &&
        !cameraPermission.granted &&
        !cameraPermission.canAskAgain
      ) {
        setCameraMessage(
          'Camera access is off. You can still choose a meal from Photos.',
        );
        return;
      }

      const permission = cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();

      if (permission.granted) {
        setCameraVisible(true);
      } else {
        setCameraMessage(
          'Camera access is off. You can still choose a meal from Photos.',
        );
      }
    } catch {
      setCameraMessage(
        'Camera is unavailable on this device. Choose a meal from Photos instead.',
      );
    } finally {
      cameraRequestLocked.current = false;
      setCameraBusy(false);
    }
  }, [cameraPermission, requestCameraPermission, state.status]);

  const cameraUnavailable = useCallback(() => {
    setCameraVisible(false);
    setCameraMessage(
      'Camera is unavailable on this device. Choose a meal from Photos instead.',
    );
  }, []);

  const acceptResult = useCallback(() => {
    if (state.status !== 'result' || acceptLocked.current) {
      return;
    }

    acceptLocked.current = true;
    dispatch({ type: 'accept' });
    acceptMeal({
      id: state.requestId,
      food: state.result.food,
      calories: state.result.calories,
      protein_g: state.result.protein_g,
      carbs_g: state.result.carbs_g,
      fat_g: state.result.fat_g,
      confidence: state.result.confidence,
      thumbnailUri: state.photo.uri,
      loggedAt: Date.now(),
    });
    dispatch({ type: 'accepted' });
    router.back();
  }, [acceptMeal, state]);

  if (cameraVisible && (state.status === 'acquiring' || state.status === 'idle')) {
    return (
      <CameraCaptureView
        onCapture={(source) => {
          setCameraVisible(false);
          void processImageSource(source);
        }}
        onClose={closeScanner}
        onPhotos={() => void choosePhoto()}
        onUnavailable={cameraUnavailable}
      />
    );
  }

  if (state.status === 'preparing') {
    return (
      <ScanPhotoStage photoUri={state.sourceUri}>
        <AnalyzingOverlay
          onClose={closeScanner}
          subtitle="Optimizing image quality"
          title="Preparing your photo"
        />
      </ScanPhotoStage>
    );
  }

  const photo = getPreparedPhoto(state);

  if (state.status === 'analyzing' && photo) {
    return (
      <ScanPhotoStage photoUri={photo.uri}>
        <AnalyzingOverlay onClose={closeScanner} />
      </ScanPhotoStage>
    );
  }

  if ((state.status === 'result' || state.status === 'accepting') && photo) {
    return (
      <ScanPhotoStage photoUri={photo.uri}>
        <ResultCard
          accepting={state.status === 'accepting'}
          onAccept={acceptResult}
          onDiscard={closeScanner}
          result={state.result}
        />
      </ScanPhotoStage>
    );
  }

  if (state.status === 'error' && photo) {
    return (
      <ScanPhotoStage photoUri={photo.uri}>
        <ErrorOverlay onDiscard={closeScanner} />
      </ScanPhotoStage>
    );
  }

  return (
    <AcquisitionView
      busy={false}
      cameraBusy={cameraBusy}
      cameraMessage={cameraMessage}
      errorMessage={preparationError}
      onCamera={() => void openCamera()}
      onClose={closeScanner}
      onPhotos={() => void choosePhoto()}
    />
  );
}

export default ScanScreen;

const styles = StyleSheet.create({
  errorSafeArea: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  errorCard: {
    borderRadius: 24,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  errorAction: {
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 50,
  },
  errorActionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
