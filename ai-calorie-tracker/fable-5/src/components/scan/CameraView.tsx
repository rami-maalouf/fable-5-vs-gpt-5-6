// full-screen rear-camera acquisition. requests permission only once the
// user has chosen the camera, freezes the captured frame over the live
// preview so the handoff to preparation has no blank frame, and keeps the
// library and close actions reachable when the camera is denied or
// unavailable so the flow never dead-ends.
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { SourceImage } from '@/services/prepare-image';
import { fontScaleCap, radius, spacing, typeScale } from '@/theme/tokens';
import { useThemeColors } from '@/theme/use-theme-colors';
import type { ColorTokens } from '@/theme/tokens';

type CameraCaptureProps = {
  // receives the captured photo; the parent feeds it into the same
  // preparation pipeline the library path uses
  onCapture: (source: SourceImage) => void;
  onChooseLibrary: () => void;
  // returns to the acquisition choices
  onClose: () => void;
};

const DENIED_COPY =
  'Nourish does not have camera access. You can allow the camera for ' +
  'Nourish in the Settings app, or pick a photo from your library instead.';
const UNAVAILABLE_COPY =
  'The camera could not start on this device. Pick a photo from your ' +
  'library instead.';

function CloseGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M6 6 L18 18 M18 6 L6 18"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BlockedCameraGlyph({ color }: { color: string }) {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24">
      <Path
        d="M9 6.5 L10.4 4 H13.6 L15 6.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Rect
        x={3}
        y={6.5}
        width={18}
        height={13.5}
        rx={4}
        stroke={color}
        strokeWidth={1.6}
        fill="none"
      />
      <Circle cx={12} cy={13} r={3.6} stroke={color} strokeWidth={1.6} fill="none" />
      <Path
        d="M4.5 20 L19.5 6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

type BlockedViewProps = {
  title: string;
  body: string;
  colors: ColorTokens;
  onChooseLibrary: () => void;
};

// in-context explanation when the camera cannot be used; the library action
// stays primary so the scan flow remains completable
function BlockedView({ title, body, colors, onChooseLibrary }: BlockedViewProps) {
  return (
    <View style={styles.blocked} accessibilityLiveRegion="polite">
      <BlockedCameraGlyph color={colors.onStage} />
      <Text style={[styles.blockedTitle, { color: colors.onStage }]}>
        {title}
      </Text>
      <Text style={[styles.blockedBody, { color: colors.onStage }]}>{body}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose from library"
        onPress={onChooseLibrary}
        style={({ pressed }) => [
          styles.libraryAction,
          { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text
          maxFontSizeMultiplier={fontScaleCap.pill}
          style={[styles.libraryActionLabel, { color: colors.onAccent }]}
        >
          Choose from library
        </Text>
      </Pressable>
    </View>
  );
}

export function CameraCapture({
  onCapture,
  onChooseLibrary,
  onClose,
}: CameraCaptureProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<ExpoCameraView>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  // the captured frame is rendered over the live preview immediately so the
  // transition into the prepared-photo stage never shows a blank frame
  const [frozenUri, setFrozenUri] = useState<string | null>(null);
  // one capture produces at most one photo, even under rapid double presses
  const captureInFlightRef = useRef(false);
  const requestedRef = useRef(false);

  // permission is requested on demand: only now that the user chose the
  // camera, and only while the system may still show its own dialog
  useEffect(() => {
    if (
      permission &&
      !permission.granted &&
      permission.canAskAgain &&
      !requestedRef.current
    ) {
      requestedRef.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleShutter = useCallback(async () => {
    if (captureInFlightRef.current || frozenUri !== null) {
      return;
    }
    captureInFlightRef.current = true;
    // spec requires a capture haptic on the shutter
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        shutterSound: false,
      });
      if (!photo) {
        throw new Error('capture returned no photo');
      }
      setFrozenUri(photo.uri);
      onCapture({ uri: photo.uri, width: photo.width, height: photo.height });
    } catch {
      captureInFlightRef.current = false;
      setUnavailable(true);
    }
  }, [frozenUri, onCapture]);

  const denied = permission?.status === 'denied';
  const blocked = unavailable || denied;

  return (
    <View style={[styles.stage, { backgroundColor: colors.stageBackground }]}>
      {blocked ? (
        <BlockedView
          title={denied && !unavailable ? 'Camera access needed' : 'Camera unavailable'}
          body={denied && !unavailable ? DENIED_COPY : UNAVAILABLE_COPY}
          colors={colors}
          onChooseLibrary={onChooseLibrary}
        />
      ) : permission?.granted ? (
        <>
          <ExpoCameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setReady(true)}
            onMountError={() => setUnavailable(true)}
            testID="camera-preview"
          />
          {frozenUri !== null ? (
            <>
              <Image
                source={{ uri: frozenUri }}
                contentFit="cover"
                transition={0}
                style={StyleSheet.absoluteFill}
                accessibilityIgnoresInvertColors
                testID="camera-frozen-photo"
              />
              <View
                pointerEvents="none"
                accessibilityLiveRegion="polite"
                style={[
                  styles.preparingArea,
                  { bottom: insets.bottom + spacing.xxxl },
                ]}
              >
                <View
                  style={[
                    styles.preparingPill,
                    { backgroundColor: colors.stageScrim },
                  ]}
                >
                  <ActivityIndicator size="small" color={colors.onStage} />
                  <Text
                    maxFontSizeMultiplier={fontScaleCap.pill}
                    style={[styles.preparingLabel, { color: colors.onStage }]}
                  >
                    Preparing photo
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View
              style={[
                styles.shutterArea,
                { bottom: insets.bottom + spacing.xl },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Capture photo"
                accessibilityState={{ disabled: !ready }}
                disabled={!ready}
                onPress={handleShutter}
                style={({ pressed }) => [
                  styles.shutter,
                  {
                    borderColor: colors.onStage,
                    opacity: !ready ? 0.4 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterCore,
                    { backgroundColor: colors.onStage },
                  ]}
                />
              </Pressable>
            </View>
          )}
        </>
      ) : // permission still loading or the system dialog is up; keep a quiet
      // stage behind it
      null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close camera"
        onPress={onClose}
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
        <CloseGlyph color={colors.onStage} />
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
  shutterArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
  },
  preparingArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  preparingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  preparingLabel: {
    ...typeScale.bodyStrong,
  },
  blocked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.lg,
  },
  blockedTitle: {
    ...typeScale.title,
    textAlign: 'center',
  },
  blockedBody: {
    ...typeScale.body,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.85,
  },
  libraryAction: {
    marginTop: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  libraryActionLabel: {
    ...typeScale.bodyStrong,
  },
});
