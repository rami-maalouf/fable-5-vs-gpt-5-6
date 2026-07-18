// in-memory day state: meals only. totals and remaining values are derived
// selectors, so the dashboard and widget always share the same arithmetic.
// everything resets on a cold launch by design.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import {
  clampProgress,
  DAILY_GOALS,
  getDaySummary,
  type DaySummary,
  type Meal,
} from '@/domain/nutrition';
import { publishRemainingCalories } from '@/services/widget';

type DayState = {
  meals: readonly Meal[];
};

type DayAction = { type: 'accept_meal'; meal: Meal };

const INITIAL_DAY_STATE: DayState = { meals: [] };

function dayReducer(state: DayState, action: DayAction): DayState {
  switch (action.type) {
    case 'accept_meal': {
      // accepting is idempotent: a meal id can be logged at most once, so
      // repeated accept taps and stale responses cannot duplicate a meal
      if (state.meals.some((meal) => meal.id === action.meal.id)) {
        return state;
      }
      return { meals: [...state.meals, action.meal] };
    }
  }
}

type DayContextValue = {
  meals: readonly Meal[];
  summary: DaySummary;
  acceptMeal: (meal: Meal) => void;
};

const DayContext = createContext<DayContextValue | null>(null);

export function DayProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dayReducer, INITIAL_DAY_STATE);

  const summary = useMemo(() => getDaySummary(state.meals), [state.meals]);

  // the widget snapshot mirrors the derived remaining calories and clamped
  // ring progress: goal + empty ring on cold launch, then the new derived
  // values after every accepted meal.
  const remainingCalories = summary.remaining.calories;
  const consumedCalories = summary.consumed.calories;
  useEffect(() => {
    publishRemainingCalories(
      remainingCalories,
      clampProgress(consumedCalories, DAILY_GOALS.calories),
    );
  }, [remainingCalories, consumedCalories]);

  const value = useMemo<DayContextValue>(
    () => ({
      meals: state.meals,
      summary,
      acceptMeal: (meal: Meal) => dispatch({ type: 'accept_meal', meal }),
    }),
    [state.meals, summary],
  );

  return <DayContext.Provider value={value}>{children}</DayContext.Provider>;
}

export function useDay(): DayContextValue {
  const value = useContext(DayContext);
  if (value === null) {
    throw new Error('useDay must be used inside DayProvider');
  }
  return value;
}
