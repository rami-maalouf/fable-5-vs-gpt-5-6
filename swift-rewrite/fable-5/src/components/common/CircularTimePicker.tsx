// ports: Components/Common/OnboardingCircularTimePicker.swift
// the signature drag-the-moon-and-sun sleep window picker: 280 ring, glow ring,
// 5-color angular-gradient arc with midnight wrap, hour markers/ticks, 52x52
// knobs, 5-minute snap with haptics, live duration + quality copy in the center
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  RoundedRect,
  Skia,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import {
  angleFromMinutes,
  durationFromAngles,
  grabTarget,
  isHealthyDuration,
  minutesFromAngle,
  pointerAngle,
  sleepQualityMessage,
  snapAngle,
} from '@/domain/circular-picker';
import { roundedFont } from '@/theme/fonts';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';

const MOON_COLOR = '#7b68ee';
const SUN_COLOR = '#ffb347';
const ARC_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#ffb347'];

// swift .spring(response: 0.3, dampingFraction: 0.7)
const KNOB_SPRING = { mass: 1, stiffness: 439, damping: 29 };

function arcPath(size: number, box: number, sleepAngle: number, wakeAngle: number) {
  const inset = (box - size) / 2;
  const oval = Skia.XYWHRect(inset, inset, size, size);
  let sweep = wakeAngle - sleepAngle;
  if (sweep < 0) sweep += 360;
  const builder = Skia.PathBuilder.Make();
  builder.addArc(oval, sleepAngle - 90, sweep);
  return builder.build();
}

function Knob({
  icon,
  color,
  angle,
  isDragging,
  radius,
  center,
}: {
  icon: 'moon.fill' | 'sun.max.fill';
  color: string;
  angle: number;
  isDragging: boolean;
  radius: number;
  center: number;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(isDragging ? 1.15 : 1, KNOB_SPRING);
  }, [isDragging, scale]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rad = (angle * Math.PI) / 180;
  const x = center + radius * Math.sin(rad);
  const y = center - radius * Math.cos(rad);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.knobOuter,
        { left: x - 26, top: y - 26 },
        { shadowColor: color, shadowOpacity: 0.4, shadowRadius: isDragging ? 12 : 6, shadowOffset: { width: 0, height: 2 } },
        animatedStyle,
      ]}>
      <View style={styles.knobInnerShadow}>
        <LinearGradient
          colors={['#ffffff', 'rgba(255, 255, 255, 0.9)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.knobFace}>
          <SymbolView name={icon} size={22} weight="semibold" tintColor={color} />
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

export function CircularTimePicker({
  sleepMinutes,
  wakeMinutes,
  onChange,
  size = 280,
}: {
  sleepMinutes: number;
  wakeMinutes: number;
  onChange: (sleepMinutes: number, wakeMinutes: number) => void;
  size?: number;
}) {
  const theme = useTheme();
  const fixed = useFixedColor();
  const moonColor = fixed(MOON_COLOR);
  const sunColor = fixed(SUN_COLOR);
  const arcColors = ARC_COLORS.map(fixed);
  const box = size + 80;
  const center = box / 2;
  const radius = size / 2;

  const [dragging, setDragging] = useState<'sleep' | 'wake' | null>(null);
  const [dragAngles, setDragAngles] = useState<{ sleep: number; wake: number } | null>(null);

  // while dragging, angles come from the gesture; otherwise from props
  const sleepAngle = dragAngles?.sleep ?? angleFromMinutes(sleepMinutes);
  const wakeAngle = dragAngles?.wake ?? angleFromMinutes(wakeMinutes);

  const { hours, minutes } = durationFromAngles(sleepAngle, wakeAngle);
  const healthy = isHealthyDuration(hours);

  const handleTouch = (x: number, y: number, isStart: boolean) => {
    const deg = pointerAngle(x - center, y - center);
    let target = dragging;
    if (isStart) {
      target = grabTarget(deg, sleepAngle, wakeAngle);
      if (!target) return;
      setDragging(target);
      setDragAngles({ sleep: sleepAngle, wake: wakeAngle });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!target) return;

    const snapped = snapAngle(deg);
    const current = dragAngles ?? { sleep: sleepAngle, wake: wakeAngle };
    if (current[target] !== snapped) {
      const next = { ...current, [target]: snapped };
      setDragAngles(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(minutesFromAngle(next.sleep), minutesFromAngle(next.wake));
    }
  };

  const endDrag = () => {
    if (dragging) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setDragging(null);
    setDragAngles(null);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => handleTouch(e.x, e.y, true))
    .onUpdate((e) => handleTouch(e.x, e.y, false))
    .onFinalize(endDrag);

  const arc = arcPath(size, box, sleepAngle, wakeAngle);
  let sweepEnd = wakeAngle - sleepAngle;
  if (sweepEnd < 0) sweepEnd += 360;

  const dragRad = ((dragging === 'sleep' ? sleepAngle : wakeAngle) * Math.PI) / 180;

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: box, height: box }}>
        <Canvas style={StyleSheet.absoluteFill}>
          {/* outer glow ring */}
          <Group opacity={0.6}>
            <Circle c={vec(center, center)} r={(size + 20) / 2} style="stroke" strokeWidth={50}>
              <SweepGradient
                c={vec(center, center)}
                colors={[fixed('rgba(175, 82, 222, 0.1)'), fixed('rgba(88, 86, 214, 0.2)'), fixed('rgba(175, 82, 222, 0.1)')]}
              />
              <BlurMask blur={15} style="normal" />
            </Circle>
          </Group>
          {/* background track */}
          <Circle c={vec(center, center)} r={radius} style="stroke" strokeWidth={40}>
            <SkiaLinearGradient
              start={vec(center, center - radius)}
              end={vec(center, center + radius)}
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
            />
          </Circle>
          {/* arc glow shadows (purple r10 + orange r20) */}
          <Path path={arc} style="stroke" strokeWidth={40} strokeCap="round" color={fixed('rgba(175, 82, 222, 0.5)')}>
            <BlurMask blur={10} style="normal" />
          </Path>
          <Path path={arc} style="stroke" strokeWidth={40} strokeCap="round" color={fixed('rgba(255, 149, 0, 0.3)')}>
            <BlurMask blur={20} style="normal" />
          </Path>
          {/* active arc with angular gradient sleep -> wake */}
          <Path path={arc} style="stroke" strokeWidth={40} strokeCap="round">
            <SweepGradient
              c={vec(center, center)}
              start={0}
              end={sweepEnd}
              colors={arcColors}
              origin={vec(center, center)}
              transform={[{ rotate: ((sleepAngle - 90) * Math.PI) / 180 }]}
            />
          </Path>
          {/* tick marks (every hour except the labeled ones) */}
          {Array.from({ length: 24 }, (_, i) => {
            if (i % 6 === 0) return null;
            const h = i % 3 === 0 ? 8 : 4;
            return (
              <Group
                key={i}
                origin={vec(center, center)}
                transform={[{ rotate: ((i / 24) * 360 * Math.PI) / 180 }]}>
                <RoundedRect x={center - 1} y={center - (radius + 8) - h / 2} width={2} height={h} r={1} color="rgba(255, 255, 255, 0.15)" />
              </Group>
            );
          })}
          {/* drag glow behind the active knob */}
          {dragging && (
            <Circle
              cx={center + radius * Math.sin(dragRad)}
              cy={center - radius * Math.cos(dragRad)}
              r={32}
              color={fixed(dragging === 'sleep' ? 'rgba(123, 104, 238, 0.3)' : 'rgba(255, 179, 71, 0.3)')}>
              <BlurMask blur={8} style="normal" />
            </Circle>
          )}
        </Canvas>

        {/* hour markers at 12/6/12/18 (rotated like the original) */}
        {[0, 6, 12, 18].map((hour) => {
          const angle = (hour / 24) * 360;
          const isMainHour = hour === 0 || hour === 12;
          return (
            <View
              key={hour}
              pointerEvents="none"
              style={[
                styles.hourMarker,
                {
                  left: center - 20,
                  top: center - 20,
                  transform: [{ rotate: `${angle}deg` }, { translateY: -(size / 2 + 35) }],
                },
              ]}>
              <Text
                style={[
                  roundedFont('600'),
                  {
                    fontSize: isMainHour ? 14 : 12,
                    color: theme.textSecondary,
                    opacity: isMainHour ? 1 : 0.7,
                  },
                ]}>
                {hour === 0 ? '12' : String(hour)}
              </Text>
              <Text style={[styles.ampm, { color: theme.textSecondary }]}>
                {hour < 12 ? 'AM' : 'PM'}
              </Text>
            </View>
          );
        })}

        {/* knobs */}
        <Knob icon="moon.fill" color={moonColor} angle={sleepAngle} isDragging={dragging === 'sleep'} radius={radius} center={center} />
        <Knob icon="sun.max.fill" color={sunColor} angle={wakeAngle} isDragging={dragging === 'wake'} radius={radius} center={center} />

        {/* center content */}
        <View pointerEvents="none" style={styles.center}>
          <View style={styles.durationRow}>
            <Text style={[styles.digits, roundedFont('700'), { color: healthy ? theme.success : theme.textPrimary }]}>
              {hours}
            </Text>
            <Text style={[styles.unit, roundedFont('500'), { color: theme.textSecondary }]}>h</Text>
            <Text style={[styles.digits, roundedFont('700'), { color: healthy ? theme.success : theme.textPrimary }]}>
              {minutes}
            </Text>
            <Text style={[styles.unit, roundedFont('500'), { color: theme.textSecondary }]}>m</Text>
          </View>
          <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>sleep duration</Text>
          <View style={styles.statusRow}>
            <SymbolView
              name={healthy ? 'checkmark.circle.fill' : 'exclamationmark.circle.fill'}
              size={12}
              tintColor={healthy ? theme.success : theme.warning}
            />
            <Text style={[styles.statusText, { color: healthy ? theme.success : theme.warning }]}>
              {sleepQualityMessage(hours)}
            </Text>
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  knobOuter: {
    position: 'absolute',
    width: 52,
    height: 52,
  },
  knobInnerShadow: {
    borderRadius: 26,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  knobFace: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  ampm: { fontSize: 8, fontWeight: '500', opacity: 0.5 },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  digits: { fontSize: 48 },
  unit: { fontSize: 24 },
  durationLabel: { fontSize: 13, fontWeight: '500' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  statusText: { fontSize: 11, fontWeight: '500' },
});
