import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import type { DaySummary, Meal } from '@/domain/nutrition';
import { getDaySummary } from '@/domain/nutrition';
import { createDemoMeals, isDemoMode } from '@/demo/demo-mode';
import { updateRemainingCaloriesWidget } from '@/services/widget';

export type DayAction =
  | { type: 'accept-meal'; meal: Meal }
  | { type: 'discard-result' };

type DayContextValue = {
  meals: readonly Meal[];
  summary: DaySummary;
  acceptMeal: (meal: Meal) => boolean;
};

const DayContext = createContext<DayContextValue | null>(null);

export function dayReducer(
  meals: readonly Meal[],
  action: DayAction,
): readonly Meal[] {
  if (action.type === 'discard-result') {
    return meals;
  }

  if (meals.some((meal) => meal.id === action.meal.id)) {
    return meals;
  }

  return [...meals, action.meal];
}

export function DayProvider({ children }: PropsWithChildren) {
  const [meals, dispatch] = useReducer(
    dayReducer,
    isDemoMode ? createDemoMeals() : ([] as readonly Meal[]),
  );
  const mealsRef = useRef(meals);

  useEffect(() => {
    const coldSummary = getDaySummary([]);
    updateRemainingCaloriesWidget(coldSummary.remaining.calories);
  }, []);

  const acceptMeal = useCallback((meal: Meal) => {
    if (mealsRef.current.some((existingMeal) => existingMeal.id === meal.id)) {
      return false;
    }

    const nextMeals = [...mealsRef.current, meal];
    mealsRef.current = nextMeals;
    dispatch({ type: 'accept-meal', meal });

    const nextSummary = getDaySummary(nextMeals);
    updateRemainingCaloriesWidget(nextSummary.remaining.calories);
    return true;
  }, []);

  const summary = useMemo(() => getDaySummary(meals), [meals]);
  const value = useMemo(
    () => ({ meals, summary, acceptMeal }),
    [acceptMeal, meals, summary],
  );

  return <DayContext.Provider value={value}>{children}</DayContext.Provider>;
}

export function useDay() {
  const context = useContext(DayContext);

  if (!context) {
    throw new Error('useDay must be used within DayProvider');
  }

  return context;
}
