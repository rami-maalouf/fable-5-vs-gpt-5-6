import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Line,
  Path,
  Skia,
  SweepGradient,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import {
  angleToSnappedMinutes,
  durationQuality,
  getArcSegments,
  minutesToAngle,
  pickClosestKnob,
  pointToAngle,
  sleepDurationMinutes,
  type ArcSegment,
  type DurationQuality,
  type TimePickerKnob,
} from '@/components/common/circularTimePickerModel';

const activeColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#ffb347'];

export interface CircularTimePickerValue {
  sleepMinutes: number;
  wakeMinutes: number;
}

interface CircularTimePickerProps extends CircularTimePickerValue {
  onChange(value: CircularTimePickerValue): void;
  size?: number;
}

export function CircularTimePicker({
  onChange,
  size = 280,
  sleepMinutes,
  wakeMinutes,
}: CircularTimePickerProps) {
  const outerSize = size + 80;
  const center = outerSize / 2;
  const ringRadius = size / 2;
  const sleepAngle = minutesToAngle(sleepMinutes);
  const wakeAngle = minutesToAngle(wakeMinutes);
  const duration = sleepDurationMinutes(sleepMinutes, wakeMinutes);
  const quality = durationQuality(duration);
  const segments = useMemo(
    () => getArcSegments(sleepMinutes, wakeMinutes),
    [sleepMinutes, wakeMinutes],
  );
  const paths = useMemo(
    () => segments.map((segment) => createArcPath(center, ringRadius, segment)),
    [center, ringRadius, segments],
  );
  const sleepPosition = polarPoint(center, ringRadius, sleepAngle);
  const wakePosition = polarPoint(center, ringRadius, wakeAngle);
  const [activeKnob, setActiveKnob] = useState<TimePickerKnob | null>(null);
  const pendingKnob = useRef<TimePickerKnob | null>(null);
  const activeKnobRef = useRef<TimePickerKnob | null>(null);
  const lastSnap = useRef<number | null>(null);
  const [sleepScale] = useState(() => new Animated.Value(1));
  const [wakeScale] = useState(() => new Animated.Value(1));
  const pulse = useSharedValue(0.88);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  useEffect(() => {
    animateKnob(sleepScale, activeKnob === 'sleep');
    animateKnob(wakeScale, activeKnob === 'wake');
  }, [activeKnob, sleepScale, wakeScale]);

  const responderAngle = (event: GestureResponderEvent) =>
    pointToAngle(event.nativeEvent.locationX, event.nativeEvent.locationY, center, center);

  const shouldStartResponder = (event: GestureResponderEvent) => {
    pendingKnob.current = pickClosestKnob(responderAngle(event), sleepAngle, wakeAngle);
    return pendingKnob.current !== null;
  };

  const startDrag = () => {
    const knob = pendingKnob.current;
    if (!knob) {
      return;
    }
    activeKnobRef.current = knob;
    lastSnap.current = knob === 'sleep' ? sleepMinutes : wakeMinutes;
    setActiveKnob(knob);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const moveDrag = (event: GestureResponderEvent) => {
    const knob = activeKnobRef.current;
    if (!knob) {
      return;
    }
    const minutes = angleToSnappedMinutes(responderAngle(event));
    if (minutes === lastSnap.current) {
      return;
    }
    lastSnap.current = minutes;
    onChange({
      sleepMinutes: knob === 'sleep' ? minutes : sleepMinutes,
      wakeMinutes: knob === 'wake' ? minutes : wakeMinutes,
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const endDrag = () => {
    if (activeKnobRef.current) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    activeKnobRef.current = null;
    pendingKnob.current = null;
    lastSnap.current = null;
    setActiveKnob(null);
  };

  return (
    <View
      accessibilityLabel={`Sleep window, ${formatClock(sleepMinutes)} to ${formatClock(wakeMinutes)}, ${formatDuration(duration)}`}
      accessibilityRole="adjustable"
      onMoveShouldSetResponder={() => activeKnobRef.current !== null}
      onResponderGrant={startDrag}
      onResponderMove={moveDrag}
      onResponderRelease={endDrag}
      onResponderTerminate={endDrag}
      onResponderTerminationRequest={() => false}
      onStartShouldSetResponder={shouldStartResponder}
      style={{ height: outerSize, width: outerSize }}
      testID="circular-time-picker"
    >
      <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          opacity={0.6}
          r={ringRadius}
          strokeWidth={50}
          style="stroke"
        >
          <SweepGradient c={vec(center, center)} colors={['#7b68ee', '#4f46e5', '#7b68ee']} />
          <BlurMask blur={15} style="normal" />
        </Circle>

        <Circle cx={center} cy={center} r={ringRadius} strokeWidth={40} style="stroke">
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
            end={vec(center + ringRadius, center + ringRadius)}
            start={vec(center - ringRadius, center - ringRadius)}
          />
        </Circle>

        {hourTicks(center, ringRadius).map((tick) => (
          <Line
            color="rgba(255,255,255,0.15)"
            key={tick.hour}
            p1={tick.start}
            p2={tick.end}
            strokeCap="round"
            strokeWidth={2}
          />
        ))}

        <Group opacity={pulse}>
          {paths.map((path, index) => (
            <Path
              color={index === 0 ? 'rgba(123,104,238,0.52)' : 'rgba(255,179,71,0.38)'}
              key={`shadow-${index}`}
              path={path}
              strokeCap="round"
              strokeWidth={44}
              style="stroke"
            >
              <BlurMask blur={index === 0 ? 10 : 20} style="normal" />
            </Path>
          ))}
          {paths.map((path, index) => (
            <Path
              key={`active-${index}`}
              path={path}
              strokeCap="round"
              strokeWidth={40}
              style="stroke"
            >
              <SweepGradient
                c={vec(center, center)}
                colors={activeColors}
                end={270}
                start={-90}
              />
            </Path>
          ))}
        </Group>

        {activeKnob === 'sleep' ? (
          <Circle color="rgba(123,104,238,0.42)" cx={sleepPosition.x} cy={sleepPosition.y} r={32}>
            <BlurMask blur={8} style="normal" />
          </Circle>
        ) : null}
        {activeKnob === 'wake' ? (
          <Circle color="rgba(255,179,71,0.42)" cx={wakePosition.x} cy={wakePosition.y} r={32}>
            <BlurMask blur={8} style="normal" />
          </Circle>
        ) : null}
      </Canvas>

      <HourLabels center={center} radius={ringRadius + 34} />
      <CenterContent duration={duration} quality={quality} />
      <Knob
        accessibilityLabel={`Bedtime ${formatClock(sleepMinutes)}`}
        color="#7b68ee"
        icon="moon.fill"
        isActive={activeKnob === 'sleep'}
        position={sleepPosition}
        scale={sleepScale}
        testID="sleep-time-knob"
      />
      <Knob
        accessibilityLabel={`Wake time ${formatClock(wakeMinutes)}`}
        color="#ffb347"
        icon="sun.max.fill"
        isActive={activeKnob === 'wake'}
        position={wakePosition}
        scale={wakeScale}
        testID="wake-time-knob"
      />
    </View>
  );
}

function Knob({
  accessibilityLabel,
  color,
  icon,
  isActive,
  position,
  scale,
  testID,
}: {
  accessibilityLabel: string;
  color: string;
  icon: 'moon.fill' | 'sun.max.fill';
  isActive: boolean;
  position: { x: number; y: number };
  scale: Animated.Value;
  testID: string;
}) {
  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      pointerEvents="none"
      testID={testID}
      style={[
        styles.knob,
        {
          left: position.x - 26,
          shadowColor: color,
          shadowRadius: isActive ? 12 : 6,
          top: position.y - 26,
          transform: [{ scale }],
        },
      ]}
    >
      <ExpoLinearGradient colors={['#ffffff', '#f2f2f7']} style={styles.knobFace}>
        <SymbolView name={icon} size={23} tintColor={color} />
      </ExpoLinearGradient>
    </Animated.View>
  );
}

function CenterContent({ duration, quality }: { duration: number; quality: DurationQuality }) {
  const { theme } = useTheme();
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const statusColor = quality.isHealthy ? theme.success : theme.warning;
  return (
    <View pointerEvents="none" style={styles.centerContent}>
      <View style={styles.durationRow}>
        <Text style={[styles.durationNumber, { color: statusColor }]}>{hours}</Text>
        <Text style={[styles.durationUnit, { color: theme.textSecondary }]}>h</Text>
        <Text style={[styles.durationNumber, { color: statusColor }]}>{minutes}</Text>
        <Text style={[styles.durationUnit, { color: theme.textSecondary }]}>m</Text>
      </View>
      <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>sleep duration</Text>
      <View style={styles.qualityRow}>
        <SymbolView
          name={quality.isHealthy ? 'checkmark.circle.fill' : 'info.circle.fill'}
          size={13}
          tintColor={statusColor}
        />
        <Text style={[styles.qualityText, { color: statusColor }]}>{quality.message}</Text>
      </View>
    </View>
  );
}

function HourLabels({ center, radius }: { center: number; radius: number }) {
  return (
    <>
      <HourLabel angle={0} center={center} period="AM" radius={radius} value="12" />
      <HourLabel angle={90} center={center} period="AM" radius={radius} value="6" />
      <HourLabel angle={180} center={center} period="PM" radius={radius} value="12" />
      <HourLabel angle={270} center={center} period="PM" radius={radius} value="18" />
    </>
  );
}

function HourLabel({
  angle,
  center,
  period,
  radius,
  value,
}: {
  angle: number;
  center: number;
  period: string;
  radius: number;
  value: string;
}) {
  const point = polarPoint(center, radius, angle);
  return (
    <View
      pointerEvents="none"
      style={[
        styles.hourLabel,
        {
          left: point.x - 22,
          top: point.y - 18,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    >
      <Text style={styles.hourValue}>{value}</Text>
      <Text style={styles.hourPeriod}>{period}</Text>
    </View>
  );
}

function createArcPath(center: number, radius: number, segment: ArcSegment): SkPath {
  const path = Skia.Path.Make();
  path.addArc(
    { height: radius * 2, width: radius * 2, x: center - radius, y: center - radius },
    segment.startAngle - 90,
    segment.sweepAngle,
  );
  return path;
}

function hourTicks(center: number, radius: number) {
  return Array.from({ length: 24 }, (_, hour) => {
    const angle = hour * 15;
    const isMajor = hour % 3 === 0;
    return {
      end: polarVector(center, radius + 8, angle),
      hour,
      start: polarVector(center, radius + (isMajor ? 0 : 4), angle),
    };
  });
}

function polarVector(center: number, radius: number, angle: number) {
  const point = polarPoint(center, radius, angle);
  return vec(point.x, point.y);
}

function polarPoint(center: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: center + Math.sin(radians) * radius,
    y: center - Math.cos(radians) * radius,
  };
}

function animateKnob(value: Animated.Value, isActive: boolean) {
  Animated.spring(value, {
    damping: 7,
    mass: 0.3,
    stiffness: 130,
    toValue: isActive ? 1.15 : 1,
    useNativeDriver: true,
  }).start();
}

function normalizeMinutes(minutes: number): number {
  const minutesPerDay = 24 * 60;
  return ((Math.round(minutes) % minutesPerDay) + minutesPerDay) % minutesPerDay;
}

function formatClock(minutes: number): string {
  const normalized = normalizeMinutes(minutes);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)} hours ${minutes % 60} minutes`;
}

const styles = StyleSheet.create({
  centerContent: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  durationLabel: { fontSize: 13, fontWeight: '500', marginTop: -2 },
  durationNumber: { fontSize: 48, fontVariant: ['tabular-nums'], fontWeight: '800' },
  durationRow: { alignItems: 'baseline', flexDirection: 'row', gap: 4 },
  durationUnit: { fontSize: 24, fontWeight: '600' },
  hourLabel: { alignItems: 'center', height: 36, position: 'absolute', width: 44 },
  hourPeriod: { color: 'rgba(255,255,255,0.40)', fontSize: 8, fontWeight: '500' },
  hourValue: { color: 'rgba(255,255,255,0.50)', fontSize: 14, fontWeight: '600' },
  knob: {
    borderRadius: 26,
    height: 52,
    position: 'absolute',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.4,
    width: 52,
  },
  knobFace: {
    alignItems: 'center',
    borderRadius: 26,
    flex: 1,
    justifyContent: 'center',
  },
  qualityRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 10 },
  qualityText: { fontSize: 11, fontWeight: '600' },
});
