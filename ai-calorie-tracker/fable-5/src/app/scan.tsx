// full-screen scan modal. owns the scan state machine and renders purely by
// screen status; every transition goes through scanReducer events.
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
import { INITIAL_SCAN_STATE, scanReducer } from '@/domain/scan-machine';
import { prepareImage } from '@/services/prepare-image';
import { radius, spacing, typeScale } from '@/theme/tokens';
import { useThemeColors } from '@/theme/use-theme-colors';

const PREPARATION_NOTICE =
  'That photo could not be read. Try another one.';

export default function ScanScreen() {
  const [state, dispatch] = useReducer(scanReducer, INITIAL_SCAN_STATE);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  // presentation-only flags; the machine still owns the flow
  const [prepFailed, setPrepFailed] = useState(false);
  const pickerOpenRef = useRef(false);

  const { screen } = state;

  useEffect(() => {
    if (screen.status === 'closed') {
      router.back();
    }
  }, [screen.status, router]);

  const handleClose = useCallback(() => {
    dispatch({ type: 'discard' });
  }, []);

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
      setPrepFailed(false);
      dispatch({ type: 'start_preparing', displayUri: asset.uri });
      try {
        const photo = await prepareImage({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        });
        dispatch({ type: 'photo_prepared', photo });
      } catch {
        setPrepFailed(true);
        dispatch({ type: 'preparation_failed' });
      }
    } finally {
      pickerOpenRef.current = false;
    }
  }, []);

  if (screen.status === 'acquiring') {
    return (
      <AcquisitionView
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
      />
    );
  }

  // every remaining status keeps the selected photo mounted full screen with
  // overlays layered above it, so the image never flashes away
  const stageUri =
    screen.status === 'preparing' ? screen.displayUri : screen.photo.uri;
  const overlayLabel =
    screen.status === 'preparing'
      ? 'Preparing photo'
      : screen.status === 'analyzing'
        ? 'Analyzing your meal'
        : null;

  return (
    <View style={[styles.stage, { backgroundColor: colors.stageBackground }]}>
      <Image
        source={{ uri: stageUri }}
        contentFit="cover"
        transition={0}
        style={StyleSheet.absoluteFill}
        accessibilityIgnoresInvertColors
        accessible
        accessibilityRole="image"
        accessibilityLabel="Selected meal photo"
        testID="scan-photo"
      />
      {overlayLabel ? (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.overlayArea, { bottom: insets.bottom + spacing.xxxl }]}
        >
          <View style={[styles.overlayPill, { backgroundColor: colors.stageScrim }]}>
            <ActivityIndicator size="small" color={colors.onStage} />
            <Text style={[styles.overlayLabel, { color: colors.onStage }]}>
              {overlayLabel}
            </Text>
          </View>
        </View>
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
