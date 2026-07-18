// one persistent photo layer for the scan flow. the base image keeps showing
// the original display uri from preparing all the way through analyzing,
// result, and errors, so the element never remounts and the frame never
// blanks. when the prepared jpeg exists it crossfades in above the base
// without changing contentFit or geometry; both layers render the same
// content, so the handoff is invisible.
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { motion } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/use-reduced-motion';

type ScanPhotoStageProps = {
  // the uri the user saw first: raw library asset or frozen camera frame
  displayUri: string;
  // the prepared jpeg once it exists; null while preparing
  preparedUri: string | null;
};

export function ScanPhotoStage({ displayUri, preparedUri }: ScanPhotoStageProps) {
  const reducedMotion = useReducedMotion();
  // stable animated node; useState initializer keeps it off the ref rule
  const [preparedOpacity] = useState(() => new Animated.Value(0));

  // a cleared or replaced prepared uri restarts the crossfade from hidden
  useEffect(() => {
    if (!preparedUri) {
      preparedOpacity.stopAnimation();
      preparedOpacity.setValue(0);
    }
  }, [preparedUri, preparedOpacity]);

  // fade in only after the prepared file has decoded, so a blank frame can
  // never cover the base photo; reduce-motion swaps the fade for an
  // immediate opacity change
  const handlePreparedLoad = useCallback(() => {
    if (reducedMotion) {
      preparedOpacity.setValue(1);
      return;
    }
    Animated.timing(preparedOpacity, {
      toValue: 1,
      duration: motion.quick,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, preparedOpacity]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={{ uri: displayUri }}
        contentFit="cover"
        transition={0}
        style={StyleSheet.absoluteFill}
        accessibilityIgnoresInvertColors
        accessible
        accessibilityRole="image"
        accessibilityLabel="Selected meal photo"
        testID="scan-photo"
      />
      {preparedUri ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: preparedOpacity }]}
          pointerEvents="none"
        >
          <Image
            source={{ uri: preparedUri }}
            contentFit="cover"
            transition={0}
            style={StyleSheet.absoluteFill}
            accessibilityIgnoresInvertColors
            onLoad={handlePreparedLoad}
            testID="scan-photo-prepared"
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
