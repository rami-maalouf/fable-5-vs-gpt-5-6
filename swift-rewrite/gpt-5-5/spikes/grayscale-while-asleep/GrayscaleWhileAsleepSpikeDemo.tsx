import {
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardBackground } from '@/components/common';
import { Spacing } from '@/constants/theme';
import { themes, type AppTheme } from '@/theme';

import { desaturatedNightThemes, skiaGrayscaleMatrix } from './grayscale-theme-spike';

export function GrayscaleWhileAsleepSpikeDemo() {
  const [asleep, setAsleep] = useState(false);
  const theme = asleep ? desaturatedNightThemes.twilight : themes.twilight;

  return (
    <CardBackground active={asleep} theme={theme} style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>spike</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>grayscale while asleep</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: asleep }}
          onPress={() => setAsleep((value) => !value)}
          style={[styles.toggle, { backgroundColor: theme.actionPrimary }]}>
          <Text style={styles.toggleText}>{asleep ? 'asleep' : 'awake'}</Text>
        </Pressable>
      </View>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        palette swap handles React Native views; Skia canvases get the same sleep
        state through a grayscale color matrix.
      </Text>
      <View style={styles.previewRow}>
        <PalettePreview label="twilight" theme={asleep ? desaturatedNightThemes.twilight : themes.twilight} />
        <PalettePreview label="amethyst" theme={asleep ? desaturatedNightThemes.amethyst : themes.amethyst} />
      </View>
      <Canvas style={styles.canvas}>
        <Group>
          {asleep ? <ColorMatrix matrix={[...skiaGrayscaleMatrix]} /> : null}
          <Rect x={0} y={0} width={280} height={96}>
            <LinearGradient
              colors={[...themes.twilight.backgroundGradient]}
              end={vec(280, 96)}
              start={vec(0, 0)}
            />
          </Rect>
          <Circle color={themes.twilight.accent} cx={72} cy={48} r={28} />
          <Circle color={themes.twilight.warning} cx={140} cy={48} r={28} />
          <Circle color={themes.twilight.success} cx={208} cy={48} r={28} />
        </Group>
      </Canvas>
    </CardBackground>
  );
}

function PalettePreview({ label, theme }: { label: string; theme: AppTheme }) {
  const swatches = [
    theme.backgroundGradient[0],
    theme.backgroundGradient[1],
    theme.accent,
    theme.success,
    theme.warning,
  ];

  return (
    <View style={styles.preview}>
      <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.swatches}>
        {swatches.map((color) => (
          <View key={`${label}-${color}`} style={[styles.swatch, { backgroundColor: color }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.two,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  toggle: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
  },
  toggleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  previewRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  preview: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    flex: 1,
    padding: Spacing.three,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
  },
  swatches: {
    flexDirection: 'row',
    gap: 6,
  },
  swatch: {
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  canvas: {
    borderRadius: 18,
    height: 96,
    overflow: 'hidden',
    width: '100%',
  },
});
