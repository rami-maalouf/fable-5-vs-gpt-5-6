// ports: twilight/components/common/cardbackground.swift

import {
  Blur,
  BlurMask,
  Canvas,
  Circle,
  Group,
  Paint,
  RuntimeShader,
  Skia,
  useClock,
} from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { SleepColorGroup } from '@/components/common/sleep-color-group';
import {
  AURORA_SPEC,
  createAuroraBlobs,
  type AuroraBlobSpec,
} from '@/components/common/visual-specs';
import { useTheme } from '@/theme/ThemeProvider';

interface CardBackgroundProps extends PropsWithChildren {
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface AuroraBlobProps {
  blob: AuroraBlobSpec;
  clock: SharedValue<number>;
  color: string;
  height: number;
  width: number;
}

const ALPHA_THRESHOLD_SHADER = Skia.RuntimeEffect.Make(`
  uniform shader image;
  half4 main(float2 xy) {
    half4 color = image.eval(xy);
    return color.a > ${AURORA_SPEC.alphaThreshold} ? color : half4(0);
  }
`)!;

function AuroraBlob({ blob, clock, color, height, width }: AuroraBlobProps) {
  const cx = useDerivedValue(
    () =>
      width / 2 +
      Math.sin((clock.value / 1_000) * blob.speed + blob.phaseX) *
        width *
        0.34 *
        blob.xAmplitude,
  );
  const cy = useDerivedValue(
    () =>
      height / 2 +
      Math.cos((clock.value / 1_000) * blob.speed + blob.phaseY) *
        height *
        0.3 *
        blob.yAmplitude,
  );
  const radius = Math.min(width, height) * blob.sizeFactor;

  return <Circle cx={cx} cy={cy} r={radius} color={color} />;
}

export function CardBackground({ active = false, children, style }: CardBackgroundProps) {
  const { theme } = useTheme();
  const clock = useClock();
  const blobs = useMemo(() => createAuroraBlobs(7), []);
  const [layout, setLayout] = useState({ height: 1, width: 1 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setLayout({ height, width });
  };

  return (
    <View onLayout={handleLayout} style={[styles.container, style]}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={theme.colorScheme} />
      <View style={[StyleSheet.absoluteFill, styles.material]} />
      <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
        <SleepColorGroup>
          {active ? (
            <Group
              opacity={0.45}
              layer={
                <Paint>
                  <Blur blur={12} mode="clamp">
                    <RuntimeShader source={ALPHA_THRESHOLD_SHADER}>
                      <Blur blur={AURORA_SPEC.blur} mode="clamp" />
                    </RuntimeShader>
                  </Blur>
                </Paint>
              }
            >
              {blobs.map((blob) => (
                <AuroraBlob
                  key={blob.id}
                  blob={blob}
                  clock={clock}
                  color={theme.accent}
                  height={layout.height}
                  width={layout.width}
                />
              ))}
            </Group>
          ) : (
            <Circle
              cx={layout.width * 0.9}
              cy={layout.height * 0.5}
              r={Math.min(layout.width, layout.height) * 0.42}
              color={theme.accent}
              opacity={0.5}
            >
              <BlurMask blur={15} style="normal" />
            </Circle>
          )}
        </SleepColorGroup>
      </Canvas>
      <View pointerEvents="none" style={styles.stroke} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  material: {
    backgroundColor: 'rgba(80,80,80,0.3)',
  },
  stroke: {
    bottom: 0,
    borderColor: 'rgba(142,142,147,0.3)',
    borderRadius: 24,
    borderWidth: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
