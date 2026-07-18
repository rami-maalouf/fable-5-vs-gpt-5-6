// the only bridge between app state and the home-screen widget. the widget
// snapshot is an os rendering artifact, never app persistence.
import { Platform } from 'react-native';

import RemainingCaloriesWidget from '../../widgets/RemainingCaloriesWidget';

export function publishRemainingCalories(
  remaining: number,
  progress: number,
): void {
  if (Platform.OS !== 'ios') {
    return;
  }
  RemainingCaloriesWidget.updateSnapshot({
    remaining: Math.round(remaining),
    progress,
  });
}
