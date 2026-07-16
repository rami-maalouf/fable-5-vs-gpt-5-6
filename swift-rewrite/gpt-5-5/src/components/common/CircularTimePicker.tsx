import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  SweepGradient,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useRef, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { themes, type AppTheme } from '@/theme';

import { rgba } from './color';
import {
  angleToMinutes,
  durationMinutesBetweenAngles,
  formatSleepDuration,
  getSleepQualityMessage,
  isHealthySleepDuration,
  minutesToAngle,
  nearestKnobForAngle,
  polarPointForAngle,
  pointToPickerAngle,
  snapAngle,
  type TimePickerKnob,
} from './circular-time-picker-geometry';

const defaultSize = 280;
const outerPadding = 40;
const ringStrokeWidth = 40;
const knobSize = 52;
const knobGlowSize = 64;
const activeColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#FFB347'];

export type CircularTimePickerChange = {
  sleepMinutes: number;
  wakeMinutes: number;
};

export type CircularTimePickerProps = CircularTimePickerChange & {
  onChange: (change: CircularTimePickerChange) => void;
  size?: number;
  theme?: AppTheme;
};

type CircularTimePickerSymbolName = NonNullable<ComponentProps<typeof SymbolView>['name']>;

export function CircularTimePicker({
  onChange,
  size = defaultSize,
  sleepMinutes,
  theme = themes.twilight,
  wakeMinutes,
}: CircularTimePickerProps) {
  const frameSize = size + outerPadding * 2;
  const center = frameSize / 2;
  const radius = size / 2;
  const sleepAngle = minutesToAngle(sleepMinutes);
  const wakeAngle = minutesToAngle(wakeMinutes);
  const durationMinutes = durationMinutesBetweenAngles(sleepAngle, wakeAngle);
  const qualityMessage = getSleepQualityMessage(durationMinutes);
  const healthyDuration = isHealthySleepDuration(durationMinutes);
  const sleepPoint = polarPointForAngle({ angle: sleepAngle, center, radius });
  const wakePoint = polarPointForAngle({ angle: wakeAngle, center, radius });
  const activeArcSegments = useMemo(
    () => makeActiveArcSegments({ center, radius, sleepAngle, wakeAngle }),
    [center, radius, sleepAngle, wakeAngle],
  );
  const [activeKnob, setActiveKnob] = useState<TimePickerKnob | null>(null);
  const activeKnobRef = useRef<TimePickerKnob | null>(null);
  const lastSnappedAngleRef = useRef<number | null>(null);

  const updateFromPoint = useCallback(
    (x: number, y: number, forceHaptic = false) => {
      const knob = activeKnobRef.current;

      if (knob == null) {
        return;
      }

      const angle = snapAngle(pointToPickerAngle({ x, y, centerX: center, centerY: center }));

      if (angle === lastSnappedAngleRef.current) {
        return;
      }

      lastSnappedAngleRef.current = angle;

      if (forceHaptic) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const nextMinutes = angleToMinutes(angle);

      onChange({
        sleepMinutes: knob === 'sleep' ? nextMinutes : sleepMinutes,
        wakeMinutes: knob === 'wake' ? nextMinutes : wakeMinutes,
      });
    },
    [center, onChange, sleepMinutes, wakeMinutes],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        // eslint-disable-next-line react-hooks/refs -- rngh calls this after render on the js thread
        .onBegin((event) => {
          const angle = pointToPickerAngle({ x: event.x, y: event.y, centerX: center, centerY: center });
          const knob = nearestKnobForAngle({ angle, sleepAngle, wakeAngle });

          activeKnobRef.current = knob;
          setActiveKnob(knob);
          lastSnappedAngleRef.current = knob === 'sleep' ? sleepAngle : knob === 'wake' ? wakeAngle : null;

          if (knob != null) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            updateFromPoint(event.x, event.y);
          }
        })
        // eslint-disable-next-line react-hooks/refs -- rngh calls this after render on the js thread
        .onUpdate((event) => {
          updateFromPoint(event.x, event.y, true);
        })
        // eslint-disable-next-line react-hooks/refs -- rngh calls this after render on the js thread
        .onFinalize(() => {
          if (activeKnobRef.current != null) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          activeKnobRef.current = null;
          lastSnappedAngleRef.current = null;
          setActiveKnob(null);
        }),
    [center, sleepAngle, updateFromPoint, wakeAngle],
  );

  return (
    <View accessibilityLabel="sleep and wake time picker" style={[styles.wrapper, { height: frameSize, width: frameSize }]}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Group opacity={0.6}>
              <Circle cx={center} cy={center} r={radius} style="stroke" strokeWidth={50}>
                <SweepGradient c={vec(center, center)} colors={['#667eea', '#764ba2', '#3b2d72']} />
              </Circle>
            </Group>
            <Circle cx={center} cy={center} r={radius} style="stroke" strokeWidth={ringStrokeWidth}>
              <SweepGradient
                c={vec(center, center)}
                colors={[rgba('#ffffff', 0.08), rgba('#ffffff', 0.03)]}
              />
            </Circle>
            {activeArcSegments.map((path, index) => (
              <Group key={`active-arc-${index}`}>
                <Path
                  path={path}
                  style="stroke"
                  strokeCap="round"
                  strokeWidth={ringStrokeWidth}
                  color={rgba('#7B68EE', 0.5)}
                />
                <Path path={path} style="stroke" strokeCap="round" strokeWidth={ringStrokeWidth}>
                  <SweepGradient c={vec(center, center)} colors={activeColors} />
                </Path>
              </Group>
            ))}
            {Array.from({ length: 24 }, (_, hour) => {
              const tickAngle = minutesToAngle(hour * 60);
              const tickPoint = polarPointForAngle({ angle: tickAngle, center, radius: radius + 8 });
              const tickHeight = hour % 3 === 0 ? 8 : 4;

              return (
                <Group
                  key={`tick-${hour}`}
                  origin={vec(tickPoint.x, tickPoint.y)}
                  transform={[{ rotate: ((tickAngle - 90) * Math.PI) / 180 }]}>
                  <Path
                    color={rgba('#ffffff', 0.15)}
                    path={roundedTickPath(tickPoint.x, tickPoint.y, 2, tickHeight)}
                    style="fill"
                  />
                </Group>
              );
            })}
          </Canvas>
          <ClockLabels center={center} radius={radius + 35} theme={theme} />
          <CenterReadout duration={durationMinutes} healthy={healthyDuration} message={qualityMessage} theme={theme} />
          <Knob
            active={activeKnob === 'sleep'}
            color="#7B68EE"
            fallback="☾"
            point={sleepPoint}
            symbol={{ ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' }}
          />
          <Knob
            active={activeKnob === 'wake'}
            color="#FFB347"
            fallback="☀"
            point={wakePoint}
            symbol={{ ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' }}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

function makeActiveArcSegments({
  center,
  radius,
  sleepAngle,
  wakeAngle,
}: {
  center: number;
  radius: number;
  sleepAngle: number;
  wakeAngle: number;
}) {
  if (wakeAngle < sleepAngle) {
    return [makeArcPath({ center, radius, startAngle: sleepAngle, endAngle: 360 }), makeArcPath({ center, radius, startAngle: 0, endAngle: wakeAngle })];
  }

  return [makeArcPath({ center, radius, startAngle: sleepAngle, endAngle: wakeAngle })];
}

function makeArcPath({
  center,
  endAngle,
  radius,
  startAngle,
}: {
  center: number;
  endAngle: number;
  radius: number;
  startAngle: number;
}) {
  const path = Skia.Path.Make();
  const oval = Skia.XYWHRect(center - radius, center - radius, radius * 2, radius * 2);
  path.addArc(oval, startAngle - 90, endAngle - startAngle);

  return path;
}

function roundedTickPath(x: number, y: number, width: number, height: number): SkPath {
  const path = Skia.Path.Make();
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  path.addRRect(Skia.RRectXY(Skia.XYWHRect(x - halfWidth, y - halfHeight, width, height), width / 2, width / 2));

  return path;
}

function ClockLabels({ center, radius, theme }: { center: number; radius: number; theme: AppTheme }) {
  const labels = [
    { hour: 0, label: '12', meridiem: 'AM' },
    { hour: 6, label: '6', meridiem: 'AM' },
    { hour: 12, label: '12', meridiem: 'PM' },
    { hour: 18, label: '6', meridiem: 'PM' },
  ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {labels.map(({ hour, label, meridiem }) => {
        const point = polarPointForAngle({ angle: minutesToAngle(hour * 60), center, radius });

        return (
          <View key={hour} style={[styles.clockLabel, { left: point.x - 18, top: point.y - 16 }]}>
            <Text style={[styles.clockLabelText, { color: theme.textPrimary }]}>{label}</Text>
            <Text style={[styles.clockMeridiem, { color: theme.textSecondary }]}>{meridiem}</Text>
          </View>
        );
      })}
    </View>
  );
}

function CenterReadout({
  duration,
  healthy,
  message,
  theme,
}: {
  duration: number;
  healthy: boolean;
  message: string;
  theme: AppTheme;
}) {
  return (
    <View pointerEvents="none" style={styles.centerReadout}>
      <Text style={[styles.duration, { color: theme.textPrimary }]}>{formatSleepDuration(duration)}</Text>
      <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>Sleep Duration</Text>
      <View style={styles.qualityRow}>
        <SymbolView
          name={{
            ios: healthy ? 'checkmark.circle.fill' : 'exclamationmark.circle.fill',
            android: healthy ? 'check_circle' : 'error',
            web: healthy ? 'check_circle' : 'error',
          }}
          size={12}
          tintColor={healthy ? theme.success : theme.warning}
        />
        <Text style={[styles.qualityText, { color: healthy ? theme.success : theme.warning }]}>{message}</Text>
      </View>
    </View>
  );
}

function Knob({
  active,
  color,
  fallback,
  point,
  symbol,
}: {
  active: boolean;
  color: string;
  fallback: string;
  point: { x: number; y: number };
  symbol: CircularTimePickerSymbolName;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.knobShell,
        {
          left: point.x - knobGlowSize / 2,
          top: point.y - knobGlowSize / 2,
          transform: [{ scale: active ? 1.15 : 1 }],
        },
      ]}>
      {active ? <View style={[styles.knobGlow, { backgroundColor: color }]} /> : null}
      <View style={[styles.knob, { shadowColor: color }]}>
        <SymbolView
          fallback={<Text style={[styles.fallbackSymbol, { color }]}>{fallback}</Text>}
          name={symbol}
          size={22}
          tintColor={color}
          weight="semibold"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    overflow: 'visible',
  },
  centerReadout: {
    alignItems: 'center',
    gap: 4,
    left: '50%',
    position: 'absolute',
    top: '50%',
    transform: [{ translateX: -96 }, { translateY: -42 }],
    width: 192,
  },
  duration: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2,
  },
  durationLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  qualityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
  },
  qualityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  clockLabel: {
    alignItems: 'center',
    position: 'absolute',
    width: 36,
  },
  clockLabelText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
  clockMeridiem: {
    fontSize: 8,
    fontWeight: '500',
    lineHeight: 10,
  },
  knobShell: {
    alignItems: 'center',
    height: knobGlowSize,
    justifyContent: 'center',
    position: 'absolute',
    width: knobGlowSize,
  },
  knobGlow: {
    borderRadius: knobGlowSize / 2,
    height: knobGlowSize,
    opacity: 0.22,
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    width: knobGlowSize,
  },
  knob: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: knobSize / 2,
    height: knobSize,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    width: knobSize,
  },
  fallbackSymbol: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
});
