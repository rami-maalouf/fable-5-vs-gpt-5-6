import { CameraView as ExpoCameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ImageSource } from '@/services/prepare-image';
import { useNourishTheme } from '@/theme/tokens';

type CameraCaptureViewProps = {
  onCapture: (source: ImageSource) => void;
  onClose: () => void;
  onPhotos: () => void;
  onUnavailable: () => void;
};

export function CameraCaptureView({
  onCapture,
  onClose,
  onPhotos,
  onUnavailable,
}: CameraCaptureViewProps) {
  const theme = useNourishTheme();
  const camera = useRef<ExpoCameraView | null>(null);
  const shutterLocked = useRef(false);
  const unavailableReported = useRef(false);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const reportUnavailable = useCallback(() => {
    if (unavailableReported.current) {
      return;
    }

    unavailableReported.current = true;
    shutterLocked.current = true;
    onUnavailable();
  }, [onUnavailable]);

  const capture = useCallback(async () => {
    if (!ready || shutterLocked.current || !camera.current) {
      return;
    }

    shutterLocked.current = true;
    setCapturing(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const picture = await camera.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      if (!picture) {
        throw new Error('camera returned no photo');
      }

      onCapture({
        uri: picture.uri,
        width: picture.width,
        height: picture.height,
      });
    } catch {
      shutterLocked.current = false;
      setCapturing(false);
      reportUnavailable();
    }
  }, [onCapture, ready, reportUnavailable]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.photoBackground }]}>
      <ExpoCameraView
        facing="back"
        onCameraReady={() => setReady(true)}
        onMountError={reportUnavailable}
        ref={camera}
        style={styles.preview}
      />

      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        pointerEvents="box-none"
        style={styles.controls}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Close camera"
            accessibilityRole="button"
            hitSlop={6}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: theme.photoScrim,
                borderColor: theme.onAccent,
                opacity: pressed ? 0.68 : 1,
              },
            ]}>
            <View
              accessibilityElementsHidden
              style={[styles.closeLine, styles.closeLineLeft, { backgroundColor: theme.onAccent }]}
            />
            <View
              accessibilityElementsHidden
              style={[styles.closeLine, styles.closeLineRight, { backgroundColor: theme.onAccent }]}
            />
          </Pressable>
        </View>

        <View style={styles.bottomBar}>
          <Pressable
            accessibilityLabel="Choose from Photos"
            accessibilityRole="button"
            disabled={capturing}
            onPress={onPhotos}
            style={({ pressed }) => [
              styles.photosButton,
              {
                backgroundColor: theme.photoScrim,
                borderColor: theme.onAccent,
                opacity: pressed || capturing ? 0.66 : 1,
              },
            ]}>
            <Text style={[styles.photosLabel, { color: theme.onAccent }]}>Photos</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Take meal photo"
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready || capturing }}
            disabled={!ready || capturing}
            onPress={() => void capture()}
            style={({ pressed }) => [
              styles.shutterOuter,
              {
                borderColor: theme.onAccent,
                opacity: !ready || capturing ? 0.56 : pressed ? 0.76 : 1,
              },
            ]}>
            <View style={[styles.shutterInner, { backgroundColor: theme.onAccent }]} />
          </Pressable>

          <View accessibilityElementsHidden style={styles.controlSpacer} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  preview: {
    flex: 1,
  },
  controls: {
    bottom: 0,
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  topBar: {
    alignItems: 'flex-end',
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  closeLine: {
    borderRadius: 2,
    height: 2,
    position: 'absolute',
    width: 19,
  },
  closeLineLeft: {
    transform: [{ rotate: '45deg' }],
  },
  closeLineRight: {
    transform: [{ rotate: '-45deg' }],
  },
  bottomBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photosButton: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 84,
    paddingHorizontal: 16,
  },
  photosLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  shutterOuter: {
    alignItems: 'center',
    borderRadius: 40,
    borderWidth: 4,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  shutterInner: {
    borderRadius: 32,
    height: 64,
    width: 64,
  },
  controlSpacer: {
    width: 84,
  },
});
