// ports: Views/SleepChartView.swift - the dashboard week chart
// hand-rolled skia marks (spike 2 decision): negative-offset range bars, gray
// catmullRom duration line + points, dashed rulemarks with annotations, dual
// y-axis labels with 31-minute collision hiding, day+duration x labels,
// selection rule + centered popover
import { Canvas, Circle, DashPathEffect, Line, Path, RoundedRect, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import {
  calculateYAxisDomain,
  formatDurationShort,
  formatTimeLabel,
  normalizedDurationY,
  timeOffsetFromMinutes,
} from '@/domain/metrics/chart-data';
import { catmullRomPath } from './path-utils';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';

export interface WeekChartDay {
  dayLabel: string;
  // popover header, e.g. "Thu, Jul 10"
  dateLabel: string;
  startOffset: number;
  endOffset: number;
  durationSeconds: number;
  // day-over-day duration change vs previous tracked night, percent
  changePercent: number | null;
}

const INDIGO = '#5856d6';
const ORANGE = '#ff9500';
const GRAY = '#8e8e93';
const GREEN = '#34c759';
const RED = '#ff3b30';
const YELLOW = '#ffcc00';

const MARGIN = { top: 10, bottom: 36, left: 34, right: 60 };
const COLLISION_HOURS = 31 / 60;

function formatClockLabel(minutes: number): string {
  const h = Math.trunc(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatHm(durationSeconds: number): string {
  const totalMinutes = Math.trunc(durationSeconds / 60);
  const h = Math.trunc(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function deviationText(
  deviationMinutes: number,
  fixed: (c: string) => string
): { text: string; color: string } {
  if (deviationMinutes === 0) return { text: 'On target', color: fixed(GREEN) };
  const abs = Math.abs(deviationMinutes);
  const direction = deviationMinutes > 0 ? 'late' : 'early';
  const formatted = abs >= 60 ? `${Math.trunc(abs / 60)}h ${abs % 60}m` : `${abs}m`;
  const color = abs <= 15 ? fixed(GREEN) : abs <= 31 ? fixed(YELLOW) : '';
  return { text: `${formatted} ${direction}`, color };
}

export function WeekChart({
  days,
  optimalSleepMinutes,
  optimalWakeMinutes,
  height = 300,
  width,
}: {
  days: WeekChartDay[];
  optimalSleepMinutes: number | null;
  optimalWakeMinutes: number | null;
  height?: number;
  width: number;
}) {
  const theme = useTheme();
  const fixed = useFixedColor();
  const indigo = fixed(INDIGO);
  const orange = fixed(ORANGE);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { min: minY, max: maxY } = calculateYAxisDomain(days, optimalSleepMinutes, optimalWakeMinutes);
  const top = -minY;
  const bottom = -maxY;

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const y = (value: number) => MARGIN.top + ((top - value) / (top - bottom || 1)) * plotH;
  const bandW = plotW / Math.max(days.length, 1);
  const bandX = (i: number) => MARGIN.left + bandW * i + bandW / 2;

  const optSleepOffset = optimalSleepMinutes != null ? timeOffsetFromMinutes(optimalSleepMinutes) : null;
  const optWakeOffset = optimalWakeMinutes != null ? timeOffsetFromMinutes(optimalWakeMinutes) : null;
  const optDuration = (() => {
    if (optimalSleepMinutes == null || optimalWakeMinutes == null) return null;
    let diff = optimalWakeMinutes / 60 - optimalSleepMinutes / 60;
    if (diff < 0) diff += 24;
    return diff;
  })();

  // right axis: whole hours divisible by 4 inside the domain
  const timeValues: number[] = [];
  for (let h = Math.ceil(bottom); h <= Math.floor(top); h++) {
    if (((h % 4) + 4) % 4 === 0) timeValues.push(h);
  }
  const durationValues = [0, 4, 8, 12];

  const tracked = days
    .map((d, i) => ({ ...d, index: i }))
    .filter((d) => d.durationSeconds > 0);
  const linePoints = tracked.map((d) => ({
    x: bandX(d.index),
    y: y(normalizedDurationY(d.durationSeconds / 3600, minY, maxY)),
  }));

  const selected = selectedIndex != null ? days[selectedIndex] : null;
  const selectedDeviation = (offset: number, target: number | null) =>
    target == null ? null : Math.trunc((offset - target) * 60);

  const indexAtX = (x: number) => {
    const i = Math.floor(x / Math.max(bandW, 1));
    return Math.min(days.length - 1, Math.max(0, i));
  };
  const scrubGesture = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => setSelectedIndex(indexAtX(e.x)))
    .onUpdate((e) => setSelectedIndex(indexAtX(e.x)))
    .onFinalize(() => setSelectedIndex(null));

  return (
    <View style={{ width, height }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* grid lines at the time-axis values */}
        {timeValues.map((v) => (
          <Line
            key={`grid-${v}`}
            p1={vec(MARGIN.left, y(v))}
            p2={vec(MARGIN.left + plotW, y(v))}
            color="rgba(142, 142, 147, 0.2)"
            strokeWidth={0.5}
          />
        ))}
        {/* optimal duration rule (gray dashed) on the normalized duration scale */}
        {optDuration != null && (
          <Line
            p1={vec(MARGIN.left, y(normalizedDurationY(optDuration, minY, maxY)))}
            p2={vec(MARGIN.left + plotW, y(normalizedDurationY(optDuration, minY, maxY)))}
            color="rgba(142, 142, 147, 0.8)"
            strokeWidth={2}>
            <DashPathEffect intervals={[4, 4]} />
          </Line>
        )}
        {/* duration line (gray catmullRom) behind the bars */}
        {linePoints.length > 1 && (
          <Path path={catmullRomPath(linePoints)} style="stroke" strokeWidth={3} color="rgba(142, 142, 147, 0.3)" />
        )}
        {linePoints.map((p, i) => (
          <Circle key={`pt-${i}`} cx={p.x} cy={p.y} r={3.1} color={GRAY} />
        ))}
        {/* optimal sleep / wake rules */}
        {optSleepOffset != null && (
          <Line
            p1={vec(MARGIN.left, y(-optSleepOffset))}
            p2={vec(MARGIN.left + plotW, y(-optSleepOffset))}
            color={indigo}
            strokeWidth={2}>
            <DashPathEffect intervals={[4, 4]} />
          </Line>
        )}
        {optWakeOffset != null && (
          <Line
            p1={vec(MARGIN.left, y(-optWakeOffset))}
            p2={vec(MARGIN.left + plotW, y(-optWakeOffset))}
            color={orange}
            strokeWidth={2}>
            <DashPathEffect intervals={[4, 4]} />
          </Line>
        )}
        {/* sleep bars: yStart -startOffset -> yEnd -endOffset, width 25, r4 */}
        {tracked.map((d) => {
          const yTop = y(-d.startOffset);
          const yBottom = y(-d.endOffset);
          return (
            <RoundedRect
              key={`bar-${d.index}`}
              x={bandX(d.index) - 12.5}
              y={Math.min(yTop, yBottom)}
              width={25}
              height={Math.abs(yBottom - yTop)}
              r={4}
              color={theme.accent}
              opacity={0.7}
            />
          );
        })}
        {/* selection rule */}
        {selectedIndex != null && (
          <Line
            p1={vec(bandX(selectedIndex), MARGIN.top)}
            p2={vec(bandX(selectedIndex), MARGIN.top + plotH)}
            color="rgba(255, 255, 255, 0.3)"
            strokeWidth={2}
          />
        )}
      </Canvas>

      {/* leading axis: duration labels (bold gray), collision-hidden vs optimal duration */}
      {durationValues.map((h) => {
        if (optDuration != null && Math.abs(h - optDuration) < COLLISION_HOURS) return null;
        return (
          <Text
            key={`dur-${h}`}
            style={[styles.durationLabel, { top: y(normalizedDurationY(h, minY, maxY)) - 8 }]}>
            {h}h
          </Text>
        );
      })}
      {/* optimal duration annotation (leading) */}
      {optDuration != null && (
        <Text
          style={[
            styles.durationAnnotation,
            { top: y(normalizedDurationY(optDuration, minY, maxY)) - 7 },
          ]}>
          {optDuration.toFixed(1)}h
        </Text>
      )}
      {/* trailing axis: time labels (accent), collision-hidden vs optimal rules */}
      {timeValues.map((v) => {
        const clashSleep = optSleepOffset != null && Math.abs(v - -optSleepOffset) < COLLISION_HOURS;
        const clashWake = optWakeOffset != null && Math.abs(v - -optWakeOffset) < COLLISION_HOURS;
        if (clashSleep || clashWake) return null;
        return (
          <Text
            key={`time-${v}`}
            style={[styles.timeLabel, { color: theme.accent, top: y(v) - 8, left: MARGIN.left + plotW + 4 }]}>
            {formatTimeLabel(-v)}
          </Text>
        );
      })}
      {/* rule annotations (trailing, colored) */}
      {optSleepOffset != null && optimalSleepMinutes != null && (
        <Text style={[styles.ruleAnnotation, { color: indigo, top: y(-optSleepOffset) - 7, left: MARGIN.left + plotW + 4 }]}>
          {formatClockLabel(optimalSleepMinutes)}
        </Text>
      )}
      {optWakeOffset != null && optimalWakeMinutes != null && (
        <Text style={[styles.ruleAnnotation, { color: orange, top: y(-optWakeOffset) - 7, left: MARGIN.left + plotW + 4 }]}>
          {formatClockLabel(optimalWakeMinutes)}
        </Text>
      )}
      {/* x labels: day (bold) + decimal duration */}
      {days.map((d, i) => (
        <View key={`x-${i}`} style={[styles.xLabel, { left: bandX(i) - bandW / 2, width: bandW }]}>
          <Text style={[styles.xDay, { color: theme.textPrimary }]}>{d.dayLabel}</Text>
          {d.durationSeconds > 0 && (
            <Text style={[styles.xDuration, { color: theme.textSecondary }]}>
              {formatDurationShort(d.durationSeconds)}h
            </Text>
          )}
        </View>
      ))}

      {/* chartXSelection: scrub while pressing, cleared on release */}
      <GestureDetector gesture={scrubGesture}>
        <View
          style={{
            position: 'absolute',
            left: MARGIN.left,
            top: 0,
            width: plotW,
            height: MARGIN.top + plotH,
          }}
        />
      </GestureDetector>

      {/* selection popover, centered like the original chartOverlay */}
      {selected && selected.durationSeconds > 0 && (
        <View style={styles.popoverWrap} pointerEvents="none">
          <View style={styles.popover}>
            <Text style={styles.popoverDate}>{selected.dateLabel}</Text>
            <View style={styles.popoverDivider} />
            <View style={styles.popoverRow}>
              <Text style={[styles.popoverDuration, { color: theme.textPrimary }]}>
                {formatHm(selected.durationSeconds)}
              </Text>
              {selected.changePercent != null && (
                <Text
                  style={[
                    styles.popoverChange,
                    { color: fixed(selected.changePercent >= 0 ? GREEN : RED) },
                  ]}>
                  {selected.changePercent >= 0 ? '↗' : '↘'}{' '}
                  {Math.abs(Math.trunc(selected.changePercent))}%
                </Text>
              )}
            </View>
            {(
              [
                ['Bedtime', selectedDeviation(selected.startOffset, optSleepOffset), indigo],
                ['Wake', selectedDeviation(selected.endOffset, optWakeOffset), orange],
              ] as const
            ).map(([label, dev, fallback]) => {
              if (dev == null) return null;
              const { text, color } = deviationText(dev, fixed);
              return (
                <View key={label} style={styles.popoverRow}>
                  <Text style={styles.popoverDevLabel}>{label}</Text>
                  <Text style={[styles.popoverDevValue, { color: color || fallback }]}>{text}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  durationLabel: {
    position: 'absolute',
    left: 0,
    width: 30,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: GRAY,
  },
  durationAnnotation: {
    position: 'absolute',
    left: 0,
    width: 30,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
    color: GRAY,
  },
  timeLabel: {
    position: 'absolute',
    fontSize: 12,
  },
  ruleAnnotation: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '700',
  },
  xLabel: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    gap: 2,
  },
  xDay: { fontSize: 12, fontWeight: '700' },
  xDuration: { fontSize: 10, fontWeight: '500' },
  popoverWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popover: {
    backgroundColor: 'rgba(30, 30, 40, 0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 10,
    gap: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  popoverDate: { fontSize: 11, fontWeight: '600', color: '#ffffff' },
  popoverDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  popoverRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  popoverDuration: { fontSize: 12, fontWeight: '700' },
  popoverChange: { fontSize: 11, fontWeight: '600' },
  popoverDevLabel: { fontSize: 11, color: GRAY },
  popoverDevValue: { fontSize: 11, fontWeight: '500' },
});
