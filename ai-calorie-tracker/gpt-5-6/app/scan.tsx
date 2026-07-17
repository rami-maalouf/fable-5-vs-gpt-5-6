import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import { AcquisitionView } from '@/components/scan/AcquisitionView';
import { AnalyzingOverlay } from '@/components/scan/AnalyzingOverlay';
import { CameraCaptureView } from '@/components/scan/CameraView';
import { ErrorCard } from '@/components/scan/ErrorCard';
import { ResultCard } from '@/components/scan/ResultCard';
import { ScanOverlayTransition } from '@/components/scan/ScanOverlayTransition';
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

const initialAcquisitionState = scanReducer(initialScanState, {
  type: 'open',
  source: 'library',
});

type ScanScreenProps = {
  initialState?: ScanState;
};

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
  const retryLocked = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      activeRequest.current?.abort();
    };
  }, []);

  const closeScanner = useCallback(() => {
    activeRequest.current?.abort();
    dispatch({ type: 'discard' });
    router.back();
  }, []);

  const runAnalysis = useCallback(
    async (photo: PreparedPhoto, requestId: string) => {
      activeRequest.current?.abort();
      const controller = new AbortController();
      activeRequest.current = controller;

      try {
        const result = await analyzePhoto(photo.base64, controller.signal);
        if (controller.signal.aborted || !mounted.current) {
          return;
        }
        dispatch({ type: 'analysis-succeeded', requestId, result });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        if (controller.signal.aborted || !mounted.current) {
          return;
        }

        const kind =
          error instanceof AnalyzePhotoError ? error.kind : 'analysis';
        dispatch({ type: 'analysis-failed', requestId, kind });
      } finally {
        if (activeRequest.current === controller) {
          activeRequest.current = null;
          retryLocked.current = false;
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
      if (!mounted.current) {
        return;
      }
      dispatch({ type: 'photo-prepared', requestId, photo });
      void runAnalysis(photo, requestId);
    } catch {
      if (!mounted.current) {
        return;
      }
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

  const tryAnotherPhoto = useCallback(() => {
    if (state.status !== 'error' || state.kind !== 'not-food') {
      return;
    }

    activeRequest.current?.abort();
    retryLocked.current = false;
    dispatch({ type: 'try-another', source: 'library' });
  }, [state]);

  const retryAnalysis = useCallback(() => {
    if (
      state.status !== 'error' ||
      state.kind === 'not-food' ||
      retryLocked.current
    ) {
      return;
    }

    retryLocked.current = true;
    requestSequence.current += 1;
    const requestId = `retry-${Date.now()}-${requestSequence.current}`;
    dispatch({ type: 'retry-analysis', requestId });
    void runAnalysis(state.photo, requestId);
  }, [runAnalysis, state]);

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

  const photo = getPreparedPhoto(state);
  let photoUri: string | undefined;
  let overlay: ReactNode = null;
  let overlayKey: string | undefined;

  if (state.status === 'preparing') {
    photoUri = state.sourceUri;
    overlayKey = `${state.requestId}-preparing`;
    overlay = (
      <AnalyzingOverlay
        onClose={closeScanner}
        subtitle="Optimizing image quality"
        title="Preparing your photo"
      />
    );
  }

  if (state.status === 'analyzing' && photo) {
    photoUri = photo.uri;
    overlayKey = `${state.requestId}-analyzing`;
    overlay = <AnalyzingOverlay onClose={closeScanner} />;
  }

  if ((state.status === 'result' || state.status === 'accepting') && photo) {
    photoUri = photo.uri;
    overlayKey = `${state.requestId}-result`;
    overlay = (
      <ResultCard
        accepting={state.status === 'accepting'}
        onAccept={acceptResult}
        onDiscard={closeScanner}
        result={state.result}
      />
    );
  }

  if (state.status === 'error' && photo) {
    photoUri = photo.uri;
    overlayKey = `${state.requestId}-${state.kind}`;
    overlay = (
      <ErrorCard
        kind={state.kind}
        onDiscard={closeScanner}
        onRetryAnalysis={retryAnalysis}
        onTryAnother={tryAnotherPhoto}
      />
    );
  }

  if (photoUri && overlayKey && overlay) {
    return (
      <ScanPhotoStage photoUri={photoUri}>
        <ScanOverlayTransition transitionKey={overlayKey}>
          {overlay}
        </ScanOverlayTransition>
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
