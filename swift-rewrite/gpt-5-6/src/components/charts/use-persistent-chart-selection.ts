import { useState } from 'react';
import { runOnJS, type SharedValue, useAnimatedReaction } from 'react-native-reanimated';

interface ChartSelectionState {
  isActive: SharedValue<boolean>;
  matchedIndex: SharedValue<number>;
}

export function usePersistentChartSelection(
  state: ChartSelectionState,
  itemCount: number,
) {
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, itemCount - 1));
  const [hasSelection, setHasSelection] = useState(false);
  useAnimatedReaction(
    () => ({ active: state.isActive.value, index: state.matchedIndex.value }),
    (next, previous) => {
      if (next.active && next.index >= 0 && (!previous?.active || next.index !== previous.index)) {
        runOnJS(setSelectedIndex)(Math.min(itemCount - 1, next.index));
        runOnJS(setHasSelection)(true);
      }
    },
    [itemCount],
  );
  return { hasSelection, selectedIndex };
}
