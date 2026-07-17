import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AcquisitionView } from '@/components/scan/AcquisitionView';
import {
  initialScanState,
  scanReducer,
  type ScanState,
} from '@/domain/scan-machine';
import { pickLibraryImage, prepareImage } from '@/services/prepare-image';
import { useNourishTheme } from '@/theme/tokens';

const initialAcquisitionState = scanReducer(initialScanState, {
  type: 'open',
  source: 'library',
});

function PhotoPreparation({
  onClose,
  state,
}: {
  onClose: () => void;
  state: Extract<ScanState, { status: 'preparing' | 'analyzing' }>;
}) {
  const theme = useNourishTheme();
  const preparing = state.status === 'preparing';
  const photoUri = preparing ? state.sourceUri : state.photo.uri;

  return (
    <View style={[styles.photoScreen, { backgroundColor: theme.photoBackground }]}>
      <Image
        accessibilityLabel="Selected meal photo"
        contentFit="cover"
        source={{ uri: photoUri }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.photoScrim, { backgroundColor: theme.photoScrim }]} />
      <SafeAreaView style={styles.photoSafeArea}>
        <Pressable
          accessibilityLabel="Close scanner"
          accessibilityRole="button"
          onPress={onClose}
          style={[styles.photoClose, { backgroundColor: theme.surface }]}>
          <View
            style={[
              styles.photoCloseLine,
              styles.photoCloseLeft,
              { backgroundColor: theme.text },
            ]}
          />
          <View
            style={[
              styles.photoCloseLine,
              styles.photoCloseRight,
              { backgroundColor: theme.text },
            ]}
          />
        </Pressable>
        <View style={[styles.statusCard, { backgroundColor: theme.surface }]}>
          {preparing ? (
            <ActivityIndicator color={theme.coral} size="small" />
          ) : (
            <View style={[styles.readyDot, { backgroundColor: theme.coral }]} />
          )}
          <View style={styles.statusCopy}>
            <Text style={[styles.statusTitle, { color: theme.text }]}>
              {preparing ? 'Preparing your photo' : 'Photo ready'}
            </Text>
            <Text style={[styles.statusSubtitle, { color: theme.textMuted }]}>
              {preparing ? 'Optimizing image quality' : 'Ready for nutrition analysis'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function ScanScreen() {
  const [state, dispatch] = useReducer(scanReducer, initialAcquisitionState);
  const [preparationError, setPreparationError] = useState<string>();
  const requestSequence = useRef(0);

  const choosePhoto = useCallback(async () => {
    if (state.status !== 'acquiring' && state.status !== 'idle') {
      return;
    }

    setPreparationError(undefined);
    const source = await pickLibraryImage();
    if (!source) {
      return;
    }

    requestSequence.current += 1;
    const requestId = `photo-${Date.now()}-${requestSequence.current}`;
    dispatch({
      type: 'photo-selected',
      requestId,
      sourceUri: source.uri,
    });

    try {
      const photo = await prepareImage(source);
      dispatch({ type: 'photo-prepared', requestId, photo });
    } catch {
      dispatch({ type: 'discard' });
      dispatch({ type: 'open', source: 'library' });
      setPreparationError('We could not prepare that photo. Please choose another.');
    }
  }, [state.status]);

  if (state.status === 'preparing' || state.status === 'analyzing') {
    return <PhotoPreparation onClose={() => router.back()} state={state} />;
  }

  return (
    <AcquisitionView
      busy={false}
      errorMessage={preparationError}
      onClose={() => router.back()}
      onPhotos={() => void choosePhoto()}
    />
  );
}

const styles = StyleSheet.create({
  photoScreen: {
    flex: 1,
  },
  photoScrim: {
    ...StyleSheet.absoluteFill,
  },
  photoSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  photoClose: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  photoCloseLine: {
    borderRadius: 2,
    height: 2,
    position: 'absolute',
    width: 18,
  },
  photoCloseLeft: {
    transform: [{ rotate: '45deg' }],
  },
  photoCloseRight: {
    transform: [{ rotate: '-45deg' }],
  },
  statusCard: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    minHeight: 88,
    paddingHorizontal: 20,
  },
  readyDot: {
    borderRadius: 7,
    height: 14,
    width: 14,
  },
  statusCopy: {
    flex: 1,
    marginLeft: 15,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
});
