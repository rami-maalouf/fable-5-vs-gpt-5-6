import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from "react";

import { getDaySummary, type DaySummary, type Meal } from "@/domain/nutrition";
import { publishRemainingCalories } from "@/services/widget";

type DayState = {
  meals: readonly Meal[];
};

type AcceptMealAction = {
  type: "accept_meal";
  meal: Meal;
};

type DiscardResultAction = {
  type: "discard_result";
  resultId: string;
};

type DayAction = AcceptMealAction | DiscardResultAction;

type DayContextValue = {
  meals: readonly Meal[];
  summary: DaySummary;
  acceptMeal: (meal: Meal) => void;
  discardResult: (resultId: string) => void;
};

const initialDayState: DayState = {
  meals: [],
};

const DayContext = createContext<DayContextValue | null>(null);

export function DayProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(dayReducer, initialDayState);
  const summary = useMemo(() => getDaySummary(state.meals), [state.meals]);

  useEffect(() => {
    publishRemainingCalories(summary.remaining.calories);
  }, [summary]);

  const acceptMeal = useCallback((meal: Meal) => {
    dispatch({ type: "accept_meal", meal });
  }, []);

  const discardResult = useCallback((resultId: string) => {
    dispatch({ type: "discard_result", resultId });
  }, []);

  const value = useMemo<DayContextValue>(() => {
    return {
      meals: state.meals,
      summary,
      acceptMeal,
      discardResult,
    };
  }, [acceptMeal, discardResult, state.meals, summary]);

  return <DayContext.Provider value={value}>{children}</DayContext.Provider>;
}

export function useDay(): DayContextValue {
  const value = useContext(DayContext);

  if (value === null) {
    throw new Error("useDay must be used inside DayProvider");
  }

  return value;
}

function dayReducer(state: DayState, action: DayAction): DayState {
  switch (action.type) {
    case "accept_meal":
      if (state.meals.some((meal) => meal.id === action.meal.id)) {
        return state;
      }

      return {
        meals: [...state.meals, action.meal],
      };

    case "discard_result":
      return state;
  }
}
