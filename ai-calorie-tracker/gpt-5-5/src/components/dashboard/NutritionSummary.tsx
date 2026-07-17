import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import {
  type DaySummary,
  type Nutrition,
  roundNutritionForDisplay,
} from "@/domain/nutrition";
import {
  nourishRadii,
  nourishSpacing,
  type NourishTheme,
} from "@/theme/tokens";

export const NUTRITION_MOTION_MS = 550;

type NutritionSummaryProps = {
  summary: DaySummary;
  theme: NourishTheme;
};

type MacroKey = Exclude<keyof Nutrition, "calories">;

type MacroMetric = {
  key: MacroKey;
  label: string;
  color: string;
  softColor: string;
};

const RING_SIZE = 74;
const RING_STROKE_WIDTH = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE_WIDTH) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function NutritionSummary({ summary, theme }: NutritionSummaryProps) {
  const displayConsumed = roundNutritionForDisplay(summary.consumed);
  const displayRemaining = roundNutritionForDisplay(summary.remaining);
  const calorieProgress = Math.round(summary.progress.calories * 100);
  const isOverCalories = summary.remaining.calories < 0;
  const calorieValue = useAnimatedDisplayValue(
    isOverCalories ? displayConsumed.calories : Math.max(0, displayRemaining.calories),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.calorieRow}>
        <CalorieRing
          isOverCalories={isOverCalories}
          progress={summary.progress.calories}
          progressLabel={calorieProgress}
          theme={theme}
        />
        <View style={styles.calorieText}>
          <Text style={[styles.calorieNumber, { color: theme.colors.textPrimary }]}>
            {formatCalorieValue(calorieValue)}
          </Text>
          <Text style={[styles.calorieLabel, { color: theme.colors.textSecondary }]}>
            {isOverCalories ? "calories logged" : "calories left"}
          </Text>
          {isOverCalories ? (
            <Text style={[styles.overTarget, { color: theme.colors.danger }]}>
              {Math.abs(displayRemaining.calories)} over target
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.macroStack}>
        {getMacroMetrics(theme).map((metric) => (
          <MacroBar
            key={metric.key}
            metric={metric}
            consumed={displayConsumed[metric.key]}
            goal={summary.goals[metric.key]}
            remaining={displayRemaining[metric.key]}
            progress={summary.progress[metric.key]}
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
}

function CalorieRing({
  progress,
  progressLabel,
  isOverCalories,
  theme,
}: {
  progress: number;
  progressLabel: number;
  isOverCalories: boolean;
  theme: NourishTheme;
}) {
  const animatedProgress = useAnimatedScalar(progress);
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
    extrapolate: "clamp",
  });

  return (
    <View
      accessibilityLabel={`calories progress: ${progressLabel} percent`}
      style={styles.ring}
    >
      <Svg height={RING_SIZE} width={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          fill={theme.colors.surface}
          r={RING_RADIUS}
          stroke={theme.colors.accentSoft}
          strokeWidth={RING_STROKE_WIDTH}
        />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          fill="transparent"
          r={RING_RADIUS}
          rotation="-90"
          originX={RING_SIZE / 2}
          originY={RING_SIZE / 2}
          stroke={isOverCalories ? theme.colors.danger : theme.colors.accent}
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={RING_STROKE_WIDTH}
        />
      </Svg>
    </View>
  );
}

function MacroBar({
  metric,
  consumed,
  goal,
  remaining,
  progress,
  theme,
}: {
  metric: MacroMetric;
  consumed: number;
  goal: number;
  remaining: number;
  progress: number;
  theme: NourishTheme;
}) {
  const animatedProgress = useAnimatedScalar(progress);
  const animatedConsumed = useAnimatedDisplayValue(consumed);
  const animatedRemaining = useAnimatedDisplayValue(remaining);
  const width = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.macroBlock}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroLabel, { color: theme.colors.textPrimary }]}>{metric.label}</Text>
        <Text style={[styles.macroValue, { color: theme.colors.textSecondary }]}>
          {formatGramValue(animatedConsumed)} / {formatGramValue(goal)} g
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: metric.softColor }]}>
        <Animated.View style={[styles.fill, { width, backgroundColor: metric.color }]} />
      </View>
      <Text
        style={[
          styles.remaining,
          { color: animatedRemaining < 0 ? theme.colors.danger : theme.colors.textTertiary },
        ]}
      >
        {formatRemaining(animatedRemaining)}
      </Text>
    </View>
  );
}

function getMacroMetrics(theme: NourishTheme): MacroMetric[] {
  return [
    {
      key: "protein_g",
      label: "Protein",
      color: theme.colors.protein,
      softColor: theme.colors.proteinSoft,
    },
    {
      key: "carbs_g",
      label: "Carbs",
      color: theme.colors.carbs,
      softColor: theme.colors.carbsSoft,
    },
    {
      key: "fat_g",
      label: "Fat",
      color: theme.colors.fat,
      softColor: theme.colors.fatSoft,
    },
  ];
}

function formatRemaining(value: number): string {
  if (value < 0) {
    return `${formatGramValue(Math.abs(value))} g over`;
  }

  return `${formatGramValue(value)} g left`;
}

function formatCalorieValue(value: number): string {
  return String(Math.round(value));
}

function formatGramValue(value: number): string {
  const roundedValue = Math.round(value * 10) / 10;

  return Number.isInteger(roundedValue) ? String(roundedValue) : roundedValue.toFixed(1);
}

function useAnimatedScalar(target: number): Animated.Value {
  const [animatedValue] = useState(() => new Animated.Value(target));
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      animatedValue.setValue(target);
      return undefined;
    }

    const animation = Animated.timing(animatedValue, {
      toValue: target,
      duration: NUTRITION_MOTION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [animatedValue, target]);

  return animatedValue;
}

function useAnimatedDisplayValue(target: number): number {
  const [animatedValue] = useState(() => new Animated.Value(target));
  const [displayValue, setDisplayValue] = useState(target);
  const hasMounted = useRef(false);

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value }) => {
      setDisplayValue(value);
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      animatedValue.setValue(target);
      setDisplayValue(target);
      return undefined;
    }

    const animation = Animated.timing(animatedValue, {
      toValue: target,
      duration: NUTRITION_MOTION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        setDisplayValue(target);
      }
    });
    const settleTimeout = setTimeout(() => {
      setDisplayValue(target);
    }, NUTRITION_MOTION_MS);

    return () => {
      clearTimeout(settleTimeout);
      animation.stop();
    };
  }, [animatedValue, target]);

  return displayValue;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: nourishRadii.large,
    padding: nourishSpacing.four,
    gap: nourishSpacing.three,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: nourishSpacing.four,
  },
  ring: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
  },
  calorieText: {
    flex: 1,
  },
  calorieNumber: {
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -2,
  },
  calorieLabel: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "lowercase",
  },
  overTarget: {
    marginTop: nourishSpacing.one,
    fontSize: 14,
    fontWeight: "700",
  },
  macroStack: {
    gap: nourishSpacing.two,
  },
  macroBlock: {
    gap: nourishSpacing.one,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: nourishSpacing.three,
  },
  macroLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  track: {
    height: 7,
    borderRadius: nourishRadii.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: nourishRadii.pill,
  },
  remaining: {
    fontSize: 12,
    fontWeight: "700",
  },
});
