import {
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  LinearGradient as SkiaLinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AMETHYST_THEME,
  TWILIGHT_THEME,
  type AppTheme,
} from '@/theme/palettes';

import { desaturateTheme } from './desaturate-theme';

type GrayscaleMode = 'color' | 'palette' | 'native';
type NightPalette = 'twilight' | 'amethyst';

const grayscaleMatrix = [
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0, 0, 0, 1, 0,
];

export default function GrayscaleSpike() {
  const [mode, setMode] = useState<GrayscaleMode>('color');
  const [palette, setPalette] = useState<NightPalette>('twilight');
  const baseTheme = palette === 'twilight' ? TWILIGHT_THEME : AMETHYST_THEME;
  const displayTheme = useMemo(
    () => (mode === 'palette' ? desaturateTheme(baseTheme) : baseTheme),
    [baseTheme, mode],
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>GRAYSCALE SPIKE</Text>
          <Text style={styles.title}>While-asleep rendering</Text>
          <Text style={styles.subtitle}>Compare the same subtree without rebuilding the app.</Text>

          <ControlRow>
            <ControlButton active={palette === 'twilight'} label="Twilight" onPress={() => setPalette('twilight')} />
            <ControlButton active={palette === 'amethyst'} label="Amethyst" onPress={() => setPalette('amethyst')} />
          </ControlRow>
          <ControlRow>
            <ControlButton active={mode === 'color'} label="Color" onPress={() => setMode('color')} />
            <ControlButton active={mode === 'palette'} label="Palette + Skia" onPress={() => setMode('palette')} />
            <ControlButton active={mode === 'native'} label="Native filter" onPress={() => setMode('native')} />
          </ControlRow>

          <View
            collapsable={false}
            style={[styles.preview, mode === 'native' && styles.nativeFilter]}
            testID="grayscale-preview"
          >
            <LinearGradient colors={displayTheme.backgroundGradient} style={StyleSheet.absoluteFill} />
            <PreviewCanvas grayscale={mode === 'palette'} theme={baseTheme} />
            <View style={styles.previewContent}>
              <Text style={[styles.previewEyebrow, { color: displayTheme.textSecondary }]}>ACTIVE SESSION</Text>
              <Text style={[styles.previewTitle, { color: displayTheme.textPrimary }]}>Good night, Rami</Text>
              <Text style={[styles.previewSubtitle, { color: displayTheme.textSecondary }]}>Your sleep is being tracked.</Text>

              <View style={[styles.card, { backgroundColor: displayTheme.cardBackground }]}>
                <Text style={[styles.cardLabel, { color: displayTheme.textSecondary }]}>TIME ASLEEP</Text>
                <Text style={[styles.duration, { color: displayTheme.accent }]}>6h 42m</Text>
                <View style={styles.pillRow}>
                  <SemanticPill color={displayTheme.success} label="on target" />
                  <SemanticPill color={displayTheme.warning} label="wake" />
                </View>
                <View style={[styles.action, { backgroundColor: displayTheme.actionPrimary }]}>
                  <Text style={styles.actionText}>Wake up</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.modeNote}>
            {mode === 'color' && 'Baseline: full semantic color.'}
            {mode === 'palette' && 'Generated palette plus a Skia luminance matrix.'}
            {mode === 'native' && 'React Native root filter: saturate(0).'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function PreviewCanvas({ grayscale, theme }: { grayscale: boolean; theme: Readonly<AppTheme> }) {
  return (
    <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Group>
        {grayscale ? <ColorMatrix matrix={grayscaleMatrix} /> : null}
        <Rect height={210} width={340} x={0} y={0}>
          <SkiaLinearGradient
            colors={[theme.accent, theme.actionPrimary, 'transparent']}
            end={vec(320, 210)}
            start={vec(180, 20)}
          />
        </Rect>
        <Circle color={theme.warning} cx={46} cy={64} r={27} />
        <Circle color={theme.backgroundGradient[0]} cx={58} cy={52} r={27} />
        <Circle color={theme.accent} cx={285} cy={52} r={4} />
        <Circle color={theme.success} cx={306} cy={81} r={3} />
      </Group>
    </Canvas>
  );
}

function ControlRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.controls}>{children}</View>;
}

function ControlButton({ active, label, onPress }: { active: boolean; label: string; onPress(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.control, active && styles.controlActive]}
    >
      <Text style={[styles.controlText, active && styles.controlTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SemanticPill({ color, label }: { color: string; label: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', borderRadius: 15, marginTop: 18, padding: 14 },
  actionText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  card: { borderColor: 'rgba(255,255,255,0.22)', borderRadius: 20, borderWidth: 1, marginTop: 38, padding: 18 },
  cardLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  content: { padding: 18, paddingBottom: 30 },
  control: { alignItems: 'center', borderColor: 'rgba(255,255,255,0.18)', borderRadius: 12, borderWidth: 1, flex: 1, paddingHorizontal: 8, paddingVertical: 10 },
  controlActive: { backgroundColor: '#e9edf5', borderColor: '#ffffff' },
  controlText: { color: '#aab6c8', fontSize: 12, fontWeight: '700' },
  controlTextActive: { color: '#111827' },
  controls: { flexDirection: 'row', gap: 8, marginTop: 10 },
  duration: { fontSize: 42, fontWeight: '800', marginTop: 2 },
  eyebrow: { color: '#8b9dc3', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  modeNote: { color: '#8b9dc3', fontSize: 12, lineHeight: 18, marginTop: 12, textAlign: 'center' },
  nativeFilter: { filter: [{ saturate: 0 }] },
  pill: { alignItems: 'center', borderRadius: 99, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 9, paddingVertical: 6 },
  pillDot: { borderRadius: 3, height: 6, width: 6 },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pillText: { fontSize: 11, fontWeight: '800' },
  preview: { borderRadius: 24, height: 430, marginTop: 16, overflow: 'hidden' },
  previewContent: { flex: 1, padding: 20 },
  previewEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 12 },
  previewSubtitle: { fontSize: 13, marginTop: 2 },
  previewTitle: { fontSize: 28, fontWeight: '800', marginTop: 2 },
  safeArea: { flex: 1 },
  screen: { backgroundColor: '#07121d', flex: 1 },
  subtitle: { color: '#8b9dc3', fontSize: 13, marginTop: 4 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '800', marginTop: 4 },
});
