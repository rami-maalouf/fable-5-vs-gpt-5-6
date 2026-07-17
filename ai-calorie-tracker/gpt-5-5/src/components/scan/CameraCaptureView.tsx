import { CameraView as ExpoCameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  nourishRadii,
  nourishSpacing,
  nourishTouchTargets,
  type NourishTheme,
} from "@/theme/tokens";

type CapturedPhoto = {
  uri: string;
  width: number;
  height: number;
};

type CameraCaptureViewProps = {
  theme: NourishTheme;
  onCapturedPhoto: (photo: CapturedPhoto) => void;
  onChooseFromPhotos: () => void;
  onClose: () => void;
};

type CameraFailure = "denied" | "unavailable";

export function CameraCaptureView({
  theme,
  onCapturedPhoto,
  onChooseFromPhotos,
  onClose,
}: CameraCaptureViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<ExpoCameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [failure, setFailure] = useState<CameraFailure | null>(null);

  async function requestCameraAccess() {
    const nextPermission = await requestPermission();

    if (!nextPermission.granted) {
      setFailure("denied");
    }
  }

  async function capturePhoto() {
    if (isCapturing) {
      return;
    }

    const camera = cameraRef.current;

    if (!camera) {
      setFailure("unavailable");
      return;
    }

    setIsCapturing(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await camera.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      onCapturedPhoto({
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
      });
    } catch {
      setFailure("unavailable");
      setIsCapturing(false);
    }
  }

  if (failure === "unavailable") {
    return (
      <CameraCardScreen theme={theme}>
        <FallbackCard
          body="This simulator or device did not provide a usable camera preview. You can still analyze a meal photo from your library."
          primaryActionLabel="Choose from Photos"
          theme={theme}
          title="Camera unavailable"
          onChooseFromPhotos={onChooseFromPhotos}
          onClose={onClose}
        />
      </CameraCardScreen>
    );
  }

  if (!permission) {
    return (
      <CameraCardScreen theme={theme}>
        <StatusCard body="Checking camera access." theme={theme} title="Preparing camera" />
      </CameraCardScreen>
    );
  }

  if (!permission.granted) {
    if (failure === "denied" || !permission.canAskAgain) {
      return (
        <CameraCardScreen theme={theme}>
          <FallbackCard
            body="Camera permission is denied. You can choose a saved photo instead, or close this scan and enable camera access in Settings."
            primaryActionLabel="Choose from Photos"
            theme={theme}
            title="Camera access is off"
            onChooseFromPhotos={onChooseFromPhotos}
            onClose={onClose}
          />
        </CameraCardScreen>
      );
    }

    return (
      <CameraCardScreen theme={theme}>
        <FallbackCard
          body="Nourish only asks when you start the camera. Allow access to capture a meal now, or choose from Photos."
          primaryActionLabel="Allow camera"
          theme={theme}
          title="Allow camera access"
          onChooseFromPhotos={onChooseFromPhotos}
          onClose={onClose}
          onPrimaryAction={requestCameraAccess}
        />
      </CameraCardScreen>
    );
  }

  return (
    <View style={styles.previewRoot}>
      <ExpoCameraView
        active
        accessibilityLabel="Rear camera preview"
        facing="back"
        mode="picture"
        onMountError={() => {
          setFailure("unavailable");
        }}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView pointerEvents="box-none" style={styles.previewOverlay}>
        <View style={styles.previewHeader}>
          <Pressable
            accessibilityLabel="Close scan"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.glassButton}
          >
            <Text style={styles.glassButtonText}>Close</Text>
          </Pressable>
        </View>

        <View style={styles.previewFooter}>
          <View style={styles.guidance}>
            <Text style={styles.guidanceTitle}>Frame the meal</Text>
            <Text style={styles.guidanceBody}>
              Keep the plate centered and avoid hard shadows for the best estimate.
            </Text>
          </View>

          <View style={styles.cameraActions}>
            <Pressable
              accessibilityLabel="Choose from Photos"
              accessibilityRole="button"
              onPress={onChooseFromPhotos}
              style={styles.glassButton}
            >
              <Text style={styles.glassButtonText}>Photos</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Capture meal photo"
              accessibilityRole="button"
              disabled={isCapturing}
              onPress={capturePhoto}
              style={[
                styles.shutter,
                {
                  opacity: isCapturing ? 0.55 : 1,
                },
              ]}
            >
              <View style={styles.shutterInner} />
            </Pressable>

            <View style={styles.actionSpacer} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function CameraCardScreen({
  theme,
  children,
}: {
  theme: NourishTheme;
  children: ReactNode;
}) {
  return (
    <View style={[styles.cardScreen, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.cardSafeArea}>
        <View style={styles.cardContent}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

function StatusCard({
  title,
  body,
  theme,
}: {
  title: string;
  body: string;
  theme: NourishTheme;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

function FallbackCard({
  title,
  body,
  primaryActionLabel,
  theme,
  onChooseFromPhotos,
  onClose,
  onPrimaryAction,
}: {
  title: string;
  body: string;
  primaryActionLabel: string;
  theme: NourishTheme;
  onChooseFromPhotos: () => void;
  onClose: () => void;
  onPrimaryAction?: () => void;
}) {
  const primaryAction = onPrimaryAction ?? onChooseFromPhotos;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{body}</Text>

      <View style={styles.actionStack}>
        <Pressable
          accessibilityLabel={primaryActionLabel}
          accessibilityRole="button"
          onPress={primaryAction}
          style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>
            {primaryActionLabel}
          </Text>
        </Pressable>

        {onPrimaryAction ? (
          <Pressable
            accessibilityLabel="Choose from Photos"
            accessibilityRole="button"
            onPress={onChooseFromPhotos}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: theme.colors.surfaceSubtle,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>
              Choose from Photos
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityLabel="Close scan"
          accessibilityRole="button"
          onPress={onClose}
          style={[
            styles.secondaryButton,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>
            Close scan
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardScreen: {
    flex: 1,
  },
  cardSafeArea: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: nourishSpacing.five,
  },
  previewRoot: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000",
  },
  previewOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  previewHeader: {
    alignItems: "flex-end",
    paddingHorizontal: nourishSpacing.five,
    paddingTop: nourishSpacing.eight,
  },
  previewFooter: {
    gap: nourishSpacing.five,
    paddingHorizontal: nourishSpacing.five,
    paddingBottom: nourishSpacing.five,
  },
  glassButton: {
    minWidth: nourishTouchTargets.minimum,
    minHeight: nourishTouchTargets.minimum,
    borderRadius: nourishRadii.pill,
    paddingHorizontal: nourishSpacing.four,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
  },
  glassButtonText: {
    color: "#1F1712",
    fontSize: 15,
    fontWeight: "900",
  },
  guidance: {
    borderRadius: nourishRadii.large,
    padding: nourishSpacing.four,
    gap: nourishSpacing.two,
    backgroundColor: "rgba(0, 0, 0, 0.46)",
  },
  guidanceTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  guidanceBody: {
    color: "rgba(255, 255, 255, 0.86)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  cameraActions: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
  },
  actionSpacer: {
    minWidth: nourishTouchTargets.minimum,
    minHeight: nourishTouchTargets.minimum,
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
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
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
});
