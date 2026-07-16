// ports: Views/SleepMetricsView.swift chart bodies (mark-level parity per the
// spec's chart table): duration momentum, rolling consistency, rolling
// components, cumulative debt, weekday averages, duration histogram
import { Canvas, Circle, DashPathEffect, Line, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import type {
  ConsistencyPoint,
  DebtPoint,
  DurationBucket,
  MovingAveragePoint,
  WeekdayAverage,
} from '@/domain/metrics/analyzer';
import type { CalendarDay } from '@/domain/models';
import { useFixedColor, useTheme } from '@/theme/ThemeProvider';
import { catmullRomPath } from './path-utils';
import { dayIndexes, formatAbbrevDate, formatMonthDay, xTickIndexes } from './date-scale';
import { SelectionBubble, SelectionSummaryRow } from '@/components/metrics/primitives';

const GREEN = '#34c759';
const ORANGE = '#ff9500';
const INDIGO = '#5856d6';
const TEAL = '#30b0c7';
const GRAY = '#8e8e93';

const M = { top: 10, bottom: 22, left: 34, right: 8 };

interface Frame {
  width: number;
  height: number;
}

function usePlot(frame: Frame) {
  const plotW = frame.width - M.left - M.right;
  const plotH = frame.height - M.top - M.bottom;
  return { plotW, plotH };
}

function useScrub(count: number, xAt: (i: number) => number) {
  const [selected, setSelected] = useState<number | null>(null);
  const nearest = (px: number) => {
    if (count === 0) return null;
    const target = px + M.left;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < count; i++) {
      const d = Math.abs(xAt(i) - target);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  };
  const gesture = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => setSelected(nearest(e.x)))
    .onUpdate((e) => setSelected(nearest(e.x)))
    .onFinalize(() => setSelected(null));
  return { selected, gesture };
}

function ScrubOverlay({ gesture, plotW, plotH }: { gesture: any; plotW: number; plotH: number }) {
  return (
    <GestureDetector gesture={gesture}>
      <View style={{ position: 'absolute', left: M.left, top: 0, width: plotW, height: M.top + plotH }} />
    </GestureDetector>
  );
}

function XLabels({ dates, xs, xPos }: { dates: CalendarDay[]; xs: number[]; xPos: (x: number) => number }) {
  return (
    <>
      {xTickIndexes(dates.length).map((i) => (
        <Text key={`x-${i}`} style={[chartStyles.xLabel, { left: xPos(xs[i]) - 30 }]}>
          {formatMonthDay(dates[i])}
        </Text>
      ))}
    </>
  );
}

// 1. duration momentum: bars colored by target + 7-night line + target rule, y 0-12
export function MomentumChart({
  series,
  targetDurationHours,
  width,
  height = 200,
}: {
  series: MovingAveragePoint[];
  targetDurationHours: number;
  width: number;
  height?: number;
}) {
  const theme = useTheme();
  const fixed = useFixedColor();
  const { plotW, plotH } = usePlot({ width, height });
  const xs = dayIndexes(series.map((p) => p.date));
  const maxX = Math.max(xs[xs.length - 1] ?? 1, 1);
  const xPos = (x: number) => M.left + (x / maxX) * plotW;
  const yPos = (h: number) => M.top + ((12 - h) / 12) * plotH;
  const barW = Math.min(10, Math.max(2, (plotW / Math.max(series.length, 1)) * 0.55));
  const linePoints = series
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.movingAverageHours != null)
    .map(({ p, i }) => ({ x: xPos(xs[i]), y: yPos(p.movingAverageHours!) }));

  return (
    <View style={{ width, height }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {series.map((p, i) => (
          <RoundedRect
            key={i}
            x={xPos(xs[i]) - barW / 2}
            y={yPos(p.durationHours)}
            width={barW}
            height={Math.max(0, M.top + plotH - yPos(p.durationHours))}
            r={4}
            color={
              p.durationHours >= targetDurationHours
                ? fixed('rgba(52, 199, 89, 0.68)')
                : fixed('rgba(255, 149, 0, 0.65)')
            }
          />
        ))}
        {linePoints.length > 1 && (
          <Path path={catmullRomPath(linePoints)} style="stroke" strokeWidth={2.5} color={theme.actionPrimary} />
        )}
        <Line
          p1={vec(M.left, yPos(targetDurationHours))}
          p2={vec(M.left + plotW, yPos(targetDurationHours))}
          color="rgba(142, 142, 147, 0.8)"
          strokeWidth={1.5}>
          <DashPathEffect intervals={[4, 4]} />
        </Line>
      </Canvas>
      {[0, 4, 8, 12].map((t) => (
        <Text key={t} style={[chartStyles.yLabel, { top: yPos(t) - 7 }]}>
          {t}
        </Text>
      ))}
      <XLabels dates={series.map((p) => p.date)} xs={xs} xPos={xPos} />
    </View>
  );
}

// 2. rolling consistency: teal area + line + rule 80 + selection bubble
export function RollingConsistencyChart({
  points,
  domain,
  width,
  height = 200,
}: {
  points: { date: CalendarDay; score: number }[];
  domain: { lower: number; upper: number };
  width: number;
  height?: number;
}) {
  const fixed = useFixedColor();
  const teal = fixed(TEAL);
  const { plotW, plotH } = usePlot({ width, height });
  const xs = dayIndexes(points.map((p) => p.date));
  const maxX = Math.max(xs[xs.length - 1] ?? 1, 1);
  const xPos = (x: number) => M.left + (x / maxX) * plotW;
  const yPos = (v: number) =>
    M.top + ((domain.upper - v) / (domain.upper - domain.lower || 1)) * plotH;
  const linePoints = points.map((p, i) => ({ x: xPos(xs[i]), y: yPos(p.score) }));
  const { selected, gesture } = useScrub(points.length, (i) => xPos(xs[i]));

  const areaPath = () => {
    const builder = Skia.PathBuilder.Make();
    if (linePoints.length === 0) return builder.build();
    builder.moveTo(linePoints[0].x, yPos(domain.lower));
    for (const p of linePoints) builder.lineTo(p.x, p.y);
    builder.lineTo(linePoints[linePoints.length - 1].x, yPos(domain.lower));
    builder.close();
    return builder.build();
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={{ width, height }}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Path path={areaPath()} color={fixed('rgba(48, 176, 199, 0.2)')} />
          {linePoints.length > 1 && (
            <Path path={catmullRomPath(linePoints)} style="stroke" strokeWidth={3} color={teal} />
          )}
          {domain.lower <= 80 && domain.upper >= 80 && (
            <Line p1={vec(M.left, yPos(80))} p2={vec(M.left + plotW, yPos(80))} color="rgba(142, 142, 147, 0.8)" strokeWidth={1}>
              <DashPathEffect intervals={[4, 4]} />
            </Line>
          )}
          {selected != null && (
            <>
              <Line p1={vec(linePoints[selected].x, M.top)} p2={vec(linePoints[selected].x, M.top + plotH)} color="rgba(255, 255, 255, 0.45)" strokeWidth={1}>
                <DashPathEffect intervals={[2, 3]} />
              </Line>
              <Circle cx={linePoints[selected].x} cy={linePoints[selected].y} r={3.9} color={teal} />
            </>
          )}
        </Canvas>
        {[domain.lower, (domain.lower + domain.upper) / 2, domain.upper].map((t) => (
          <Text key={t} style={[chartStyles.yLabel, { top: yPos(t) - 7 }]}>
            {Math.round(t)}
          </Text>
        ))}
        <XLabels dates={points.map((p) => p.date)} xs={xs} xPos={xPos} />
        {selected != null && (
          <View style={[chartStyles.bubbleWrap, { left: Math.min(xPos(xs[selected]) + 6, width - 150) }]}>
            <SelectionBubble
              title={formatAbbrevDate(points[selected].date)}
              lines={[`Rolling Score ${points[selected].score}%`]}
            />
          </View>
        )}
        <ScrubOverlay gesture={gesture} plotW={plotW} plotH={plotH} />
      </View>
      {selected != null && (
        <SelectionSummaryRow
          label={formatAbbrevDate(points[selected].date)}
          value={`${points[selected].score}%`}
        />
      )}
    </View>
  );
}

export type RegularityComponentKey = 'bedtime' | 'wake' | 'accuracy';

export const REGULARITY_COMPONENTS: {
  key: RegularityComponentKey;
  title: string;
  color: string;
  dash: boolean;
  field: (p: ConsistencyPoint) => number | null;
}[] = [
  { key: 'bedtime', title: 'Bedtime', color: INDIGO, dash: false, field: (p) => p.sleepConsistency },
  { key: 'wake', title: 'Wake', color: ORANGE, dash: false, field: (p) => p.wakeConsistency },
  { key: 'accuracy', title: 'Accuracy', color: GREEN, dash: true, field: (p) => p.scheduleAccuracy },
];

// 3. rolling 14-night components: up to 3 linear lines lw2.8 with legend
export function ComponentsChart({
  series,
  components,
  domain,
  width,
  height = 200,
}: {
  series: ConsistencyPoint[];
  components: RegularityComponentKey[];
  domain: { lower: number; upper: number };
  width: number;
  height?: number;
}) {
  const fixed = useFixedColor();
  const { plotW, plotH } = usePlot({ width, height });
  const defs = REGULARITY_COMPONENTS.filter((c) => components.includes(c.key));
  const xs = dayIndexes(series.map((p) => p.date));
  const maxX = Math.max(xs[xs.length - 1] ?? 1, 1);
  const xPos = (x: number) => M.left + (x / maxX) * plotW;
  const yPos = (v: number) =>
    M.top + ((domain.upper - v) / (domain.upper - domain.lower || 1)) * plotH;
  const { selected, gesture } = useScrub(series.length, (i) => xPos(xs[i]));

  const linePath = (field: (p: ConsistencyPoint) => number | null) => {
    const builder = Skia.PathBuilder.Make();
    let started = false;
    series.forEach((p, i) => {
      const v = field(p);
      if (v == null) return;
      if (!started) {
        builder.moveTo(xPos(xs[i]), yPos(v));
        started = true;
      } else {
        builder.lineTo(xPos(xs[i]), yPos(v));
      }
    });
    return builder.build();
  };

  const selectedPoint = selected != null ? series[selected] : null;
  const selectionLines = selectedPoint
    ? defs.flatMap((d) => {
        const v = d.field(selectedPoint);
        return v == null ? [] : [`${d.title} ${v}%`];
      })
    : [];

  return (
    <View style={{ gap: 8 }}>
      <View style={{ width, height }}>
        <Canvas style={StyleSheet.absoluteFill}>
          {defs.map((d) => (
            <Path key={d.key} path={linePath(d.field)} style="stroke" strokeWidth={2.8} color={fixed(d.color)}>
              {d.dash ? <DashPathEffect intervals={[4, 3]} /> : null}
            </Path>
          ))}
          {selectedPoint && (
            <>
              <Line p1={vec(xPos(xs[selected!]), M.top)} p2={vec(xPos(xs[selected!]), M.top + plotH)} color="rgba(255, 255, 255, 0.45)" strokeWidth={1}>
                <DashPathEffect intervals={[2, 3]} />
              </Line>
              {defs.map((d) => {
                const v = d.field(selectedPoint);
                return v == null ? null : (
                  <Circle key={d.key} cx={xPos(xs[selected!])} cy={yPos(v)} r={3.75} color={fixed(d.color)} />
                );
              })}
            </>
          )}
        </Canvas>
        {[domain.lower, (domain.lower + domain.upper) / 2, domain.upper].map((t) => (
          <Text key={t} style={[chartStyles.yLabel, { top: yPos(t) - 7 }]}>
            {Math.round(t)}%
          </Text>
        ))}
        <XLabels dates={series.map((p) => p.date)} xs={xs} xPos={xPos} />
        {selectedPoint && (
          <View style={[chartStyles.bubbleWrap, { left: Math.min(xPos(xs[selected!]) + 6, width - 150) }]}>
            <SelectionBubble title={formatAbbrevDate(selectedPoint.date)} lines={selectionLines} />
          </View>
        )}
        <ScrubOverlay gesture={gesture} plotW={plotW} plotH={plotH} />
      </View>
      {selectedPoint && (
        <SelectionSummaryRow
          label={formatAbbrevDate(selectedPoint.date)}
          value={selectionLines.join(' • ')}
        />
      )}
    </View>
  );
}

// 4. cumulative debt: accent line lw2.5 + accent 0.18 area + zero rule
export function DebtChart({
  series,
  width,
  height = 200,
}: {
  series: DebtPoint[];
  width: number;
  height?: number;
}) {
  const theme = useTheme();
  const { plotW, plotH } = usePlot({ width, height });
  const values = series.map((p) => p.cumulativeHours);
  const lower = Math.min(0, ...values);
  const upper = Math.max(0, ...values);
  const pad = Math.max(0.5, (upper - lower) * 0.08);
  const yLower = lower - pad;
  const yUpper = upper + pad;
  const xs = dayIndexes(series.map((p) => p.date));
  const maxX = Math.max(xs[xs.length - 1] ?? 1, 1);
  const xPos = (x: number) => M.left + (x / maxX) * plotW;
  const yPos = (v: number) => M.top + ((yUpper - v) / (yUpper - yLower || 1)) * plotH;
  const linePoints = series.map((p, i) => ({ x: xPos(xs[i]), y: yPos(p.cumulativeHours) }));
  const { selected, gesture } = useScrub(series.length, (i) => xPos(xs[i]));

  const areaPath = () => {
    const builder = Skia.PathBuilder.Make();
    if (linePoints.length === 0) return builder.build();
    builder.moveTo(linePoints[0].x, yPos(0));
    for (const p of linePoints) builder.lineTo(p.x, p.y);
    builder.lineTo(linePoints[linePoints.length - 1].x, yPos(0));
    builder.close();
    return builder.build();
  };

  const fmtSigned = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}h`;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ width, height }}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Path path={areaPath()} color={`${theme.accent}2e`} />
          {linePoints.length > 1 && (
            <Path path={catmullRomPath(linePoints)} style="stroke" strokeWidth={2.5} color={theme.accent} />
          )}
          <Line p1={vec(M.left, yPos(0))} p2={vec(M.left + plotW, yPos(0))} color="rgba(142, 142, 147, 0.8)" strokeWidth={1}>
            <DashPathEffect intervals={[4, 4]} />
          </Line>
          {selected != null && (
            <>
              <Line p1={vec(linePoints[selected].x, M.top)} p2={vec(linePoints[selected].x, M.top + plotH)} color="rgba(255, 255, 255, 0.45)" strokeWidth={1}>
                <DashPathEffect intervals={[2, 3]} />
              </Line>
              <Circle cx={linePoints[selected].x} cy={linePoints[selected].y} r={3.8} color={theme.accent} />
            </>
          )}
        </Canvas>
        {[yLower, 0, yUpper].map((t) => (
          <Text key={t} style={[chartStyles.yLabel, { top: yPos(t) - 7 }]}>
            {`${t >= 0 ? '+' : ''}${Math.round(t)}h`}
          </Text>
        ))}
        <XLabels dates={series.map((p) => p.date)} xs={xs} xPos={xPos} />
        {selected != null && (
          <View style={[chartStyles.bubbleWrap, { left: Math.min(xPos(xs[selected]) + 6, width - 160) }]}>
            <SelectionBubble
              title={formatAbbrevDate(series[selected].date)}
              lines={[`Debt/Credit ${fmtSigned(series[selected].cumulativeHours)}`]}
            />
          </View>
        )}
        <ScrubOverlay gesture={gesture} plotW={plotW} plotH={plotH} />
      </View>
      {selected != null && (
        <SelectionSummaryRow
          label={formatAbbrevDate(series[selected].date)}
          value={fmtSigned(series[selected].cumulativeHours)}
        />
      )}
    </View>
  );
}

// 5. weekday averages: purple weekend bars, custom day + avg labels, y 0-12
export function WeekdayChart({
  averages,
  width,
  height = 200,
}: {
  averages: WeekdayAverage[];
  width: number;
  height?: number;
}) {
  const theme = useTheme();
  const fixed = useFixedColor();
  const { plotW, plotH } = usePlot({ width, height: height + 10 });
  const bandW = plotW / 7;
  const xPos = (i: number) => M.left + bandW * i + bandW / 2;
  const yPos = (h: number) => M.top + ((12 - h) / 12) * plotH;
  const barW = Math.min(26, bandW * 0.6);

  return (
    <View style={{ width, height: height + 10 }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {averages.map((day, i) => (
          <RoundedRect
            key={day.weekday}
            x={xPos(i) - barW / 2}
            y={yPos(day.averageHours)}
            width={barW}
            height={Math.max(0, M.top + plotH - yPos(day.averageHours))}
            r={4}
            color={
              day.weekday === 1 || day.weekday === 7
                ? fixed('rgba(175, 82, 222, 0.8)')
                : `${theme.actionPrimary}cc`
            }
          />
        ))}
      </Canvas>
      {[0, 4, 8, 12].map((t) => (
        <Text key={t} style={[chartStyles.yLabel, { top: yPos(t) - 7 }]}>
          {t}
        </Text>
      ))}
      {averages.map((day, i) => (
        <View key={day.weekday} style={[chartStyles.weekdayLabel, { left: xPos(i) - bandW / 2, width: bandW }]}>
          <Text style={[chartStyles.weekdayName, { color: theme.textPrimary }]}>{day.dayName}</Text>
          <Text style={chartStyles.weekdayAvg}>{day.averageHours.toFixed(1)}</Text>
        </View>
      ))}
    </View>
  );
}

// 6. duration histogram: accent bars with % annotations on top
export function HistogramChart({
  buckets,
  width,
  height = 200,
}: {
  buckets: DurationBucket[];
  width: number;
  height?: number;
}) {
  const theme = useTheme();
  const { plotW, plotH } = usePlot({ width, height });
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const bandW = plotW / buckets.length;
  const xPos = (i: number) => M.left + bandW * i + bandW / 2;
  const yPos = (c: number) => M.top + 14 + ((maxCount - c) / maxCount) * (plotH - 14);
  const barW = Math.min(24, bandW * 0.62);

  return (
    <View style={{ width, height }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {buckets.map((bucket, i) => (
          <RoundedRect
            key={bucket.label}
            x={xPos(i) - barW / 2}
            y={yPos(bucket.count)}
            width={barW}
            height={Math.max(0, M.top + plotH - yPos(bucket.count))}
            r={3}
            color={`${theme.accent}cc`}
          />
        ))}
      </Canvas>
      {[0, Math.round(maxCount / 2), maxCount].map((t, i) => (
        <Text key={`${t}-${i}`} style={[chartStyles.yLabel, { top: yPos(t) - 7 }]}>
          {t}
        </Text>
      ))}
      {buckets.map((bucket, i) => (
        <Text
          key={`pct-${bucket.label}`}
          style={[chartStyles.pctLabel, { left: xPos(i) - bandW / 2, width: bandW, top: yPos(bucket.count) - 16 }]}>
          {Math.round(bucket.share * 100)}%
        </Text>
      ))}
      {buckets.map((bucket, i) => (
        <Text
          key={`lbl-${bucket.label}`}
          style={[chartStyles.bucketLabel, { left: xPos(i) - bandW / 2 - 4, width: bandW + 8 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}>
          {bucket.label}
        </Text>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  yLabel: {
    position: 'absolute',
    left: 0,
    width: 30,
    textAlign: 'right',
    fontSize: 11,
    color: GRAY,
  },
  xLabel: { position: 'absolute', bottom: 0, width: 60, textAlign: 'center', fontSize: 11, color: GRAY },
  bubbleWrap: { position: 'absolute', top: 4 },
  weekdayLabel: { position: 'absolute', bottom: 0, alignItems: 'center', gap: 1 },
  weekdayName: { fontSize: 11, fontWeight: '700' },
  weekdayAvg: { fontSize: 10, fontWeight: '500', color: GRAY },
  pctLabel: { position: 'absolute', textAlign: 'center', fontSize: 10, color: GRAY },
  bucketLabel: { position: 'absolute', bottom: 0, textAlign: 'center', fontSize: 9, color: GRAY },
});
