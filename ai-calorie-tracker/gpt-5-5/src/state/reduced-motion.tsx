import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo } from "react-native";

const ReducedMotionContext = createContext(false);

type ReducedMotionProviderProps = {
  children: ReactNode;
  initialPreference?: boolean;
};

export function ReducedMotionProvider({
  children,
  initialPreference = true,
}: ReducedMotionProviderProps) {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(initialPreference);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((nextPreference) => {
        if (isMounted) {
          setIsReducedMotionEnabled(nextPreference);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsReducedMotionEnabled(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setIsReducedMotionEnabled,
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <ReducedMotionContext.Provider value={isReducedMotionEnabled}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotion(): boolean {
  return useContext(ReducedMotionContext);
}
