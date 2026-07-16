// ports: Components/Common/CardBackground.swift
// large-card surface: radius 24, ultraThinMaterial 0.7, gray 0.3 stroke.
// inactive: static spotlight blob at (90% w, 50% h). active: metaball aurora (skia).
import {
  Blur,
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  LinearGradient as SkiaLinearGradient,
  Paint,
  useClock,
  vec,
} from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';
import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

interface BlobSpec {
  speed: number;
  baseSizeFactor: number;
  sizeJitter: number;
  xAmplitudeFactor: number;
  yAmplitudeFactor: number;
  phaseX: number;
  phaseY: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function makeBlobs(count: number): BlobSpec[] {
  return Array.from({ length: Math.max(3, count) }, () => ({
    speed: rand(0.18, 0.32),
    baseSizeFactor: rand(0.3, 0.55),
    sizeJitter: rand(0.04, 0.1),
    xAmplitudeFactor: rand(0.75, 1.15),
    yAmplitudeFactor: rand(0.75, 1.15),
    phaseX: rand(0, 2 * Math.PI),
    phaseY: rand(0, 2 * Math.PI),
  }));
}

function AuroraBlob({
  blob,
  clock,
  width,
  height,
}: {
  blob: BlobSpec;
  clock: { value: number };
  width: number;
  height: number;
}) {
  const cx = useDerivedValue(() => {
    const t = clock.value / 1000;
    return width * 0.5 + Math.cos(t * blob.speed + blob.phaseX) * width * 0.35 * blob.xAmplitudeFactor;
  });
  const cy = useDerivedValue(() => {
    const t = clock.value / 1000;
    return (
      height * 0.5 + Math.sin(t * blob.speed * 0.9 + blob.phaseY) * height * 0.35 * blob.yAmplitudeFactor
    );
  });
  const r = useDerivedValue(() => {
    const t = clock.value / 1000;
    const base = Math.min(width, height) * blob.baseSizeFactor;
    const pulse = 1 + blob.sizeJitter * Math.sin(t * blob.speed * 0.6 + (blob.phaseX + blob.phaseY) * 0.5);
    return (base * pulse) / 2;
  });
  return <Circle cx={cx} cy={cy} r={r} color="white" />;
}

// gooey metaball look: blur 28 then push alpha through a threshold (~0.45)
function Aurora({ width, height, accent }: { width: number; height: number; accent: string }) {
  const clock = useClock();
  const blobs = useMemo(() => makeBlobs(5), []);
  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Group
        layer={
          <Paint>
            <Blur blur={28} />
            <ColorMatrix
              matrix={[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 18, -8.1]}
            />
          </Paint>
        }>
        <Group
          layer={
            <Paint opacity={0.82}>
              <SkiaLinearGradient
                start={vec(0, 0)}
                end={vec(width, height)}
                colors={[accent, `${accent}cc`]}
              />
            </Paint>
          }>
          {blobs.map((blob, i) => (
            <AuroraBlob key={i} blob={blob} clock={clock} width={width} height={height} />
          ))}
        </Group>
      </Group>
    </Canvas>
  );
}

export function CardBackground({
  isActive = false,
  children,
  style,
  contentStyle,
}: {
  isActive?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const tint = theme.name === 'sunset' ? 'systemUltraThinMaterialLight' : 'systemUltraThinMaterialDark';

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ width, height });
  };

  const spotRadius = size.width * 0.25;
  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      <BlurView
        intensity={70}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      {size.width > 0 &&
        (isActive ? (
          <Aurora width={size.width} height={size.height} accent={theme.accent} />
        ) : (
          <Canvas style={StyleSheet.absoluteFill}>
            <Circle
              cx={size.width * 0.9}
              cy={size.height / 2}
              r={spotRadius}
              color={theme.accent}
              opacity={0.5}>
              <Blur blur={15} />
            </Circle>
          </Canvas>
        ))}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    overflow: 'hidden',
  },
});
