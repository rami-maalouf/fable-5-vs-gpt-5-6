import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ScanScreen } from '../../app/scan';
import { MealList } from '../../src/components/dashboard/MealList';
import type { ScanSuccess } from '../../src/domain/scan-contract';
import type { PreparedPhoto, ScanState } from '../../src/domain/scan-machine';
import { updateRemainingCaloriesWidget } from '../../src/services/widget';
import { DayProvider, useDay } from '../../src/state/day-context';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock('../../src/components/scan/ResultCard', () => {
  const React = jest.requireActual('react');
  const { Pressable, Text, View } = jest.requireActual('react-native');

  return {
    ResultCard: ({
      onAccept,
      onDiscard,
    }: {
      onAccept: () => void;
      onDiscard: () => void;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(
          Pressable,
          {
            accessibilityLabel: 'Accept estimate',
            accessibilityRole: 'button',
            onPress: () => {
              onAccept();
              onAccept();
            },
          },
          React.createElement(Text, null, 'Accept'),
        ),
        React.createElement(
          Pressable,
          {
            accessibilityLabel: 'Discard estimate',
            accessibilityRole: 'button',
            onPress: onDiscard,
          },
          React.createElement(Text, null, 'Discard'),
        ),
      ),
  };
});

jest.mock('../../src/services/widget', () => ({
  defaultCaloriesRemaining: 2_000,
  updateRemainingCaloriesWidget: jest.fn(),
}));

const preparedPhoto: PreparedPhoto = {
  uri: 'file:///prepared-salmon.jpg',
  base64: 'prepared-jpeg-base64',
  width: 1_024,
  height: 768,
};

const result: ScanSuccess = {
  food: 'Salmon pasta',
  calories: 850,
  protein_g: 64.8,
  carbs_g: 101.6,
  fat_g: 42.5,
  confidence: 0.9,
};

const resultState: ScanState = {
  status: 'result',
  requestId: 'scan-salmon',
  photo: preparedPhoto,
  result,
};

function DayObserver() {
  const { meals, summary } = useDay();

  return (
    <View>
      <Text testID="meal-count">{meals.length}</Text>
      <Text testID="consumed-calories">{summary.consumed.calories}</Text>
      <Text testID="consumed-protein">{summary.consumed.protein_g}</Text>
      <Text testID="consumed-carbs">{summary.consumed.carbs_g}</Text>
      <Text testID="consumed-fat">{summary.consumed.fat_g}</Text>
      <Text testID="remaining-calories">{summary.remaining.calories}</Text>
      <MealList meals={meals} />
    </View>
  );
}

function renderScan() {
  return render(
    <DayProvider>
      <ScanScreen initialState={resultState} />
      <DayObserver />
    </DayProvider>,
  );
}

describe('scan acceptance integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('locks rapid acceptance to one meal, one widget update, and the prepared thumbnail', async () => {
    await renderScan();
    await waitFor(() => {
      expect(updateRemainingCaloriesWidget).toHaveBeenCalledWith(2_000);
    });

    const accept = screen.getByRole('button', { name: 'Accept estimate' });
    fireEvent.press(accept);

    await waitFor(() => {
      expect(screen.getByTestId('meal-count')).toHaveTextContent('1');
    });
    expect(screen.getByTestId('consumed-calories')).toHaveTextContent('850');
    expect(screen.getByTestId('consumed-protein')).toHaveTextContent('64.8');
    expect(screen.getByTestId('consumed-carbs')).toHaveTextContent('101.6');
    expect(screen.getByTestId('consumed-fat')).toHaveTextContent('42.5');
    expect(screen.getByTestId('remaining-calories')).toHaveTextContent('1150');
    expect(screen.getByLabelText('Salmon pasta thumbnail')).toHaveProp('source', [
      { uri: preparedPhoto.uri },
    ]);
    expect(updateRemainingCaloriesWidget).toHaveBeenCalledTimes(2);
    expect(updateRemainingCaloriesWidget).toHaveBeenLastCalledWith(1_150);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(
      jest.mocked(updateRemainingCaloriesWidget).mock.invocationCallOrder[1],
    ).toBeLessThan(jest.mocked(router.back).mock.invocationCallOrder[0]);
  });

  it('discards without changing the day or issuing another widget update', async () => {
    await renderScan();
    await waitFor(() => {
      expect(updateRemainingCaloriesWidget).toHaveBeenCalledWith(2_000);
    });
    const discard = screen.getByRole('button', { name: 'Discard estimate' });
    fireEvent.press(discard);

    expect(screen.getByTestId('meal-count')).toHaveTextContent('0');
    expect(screen.getByTestId('consumed-calories')).toHaveTextContent('0');
    expect(screen.getByTestId('remaining-calories')).toHaveTextContent('2000');
    expect(updateRemainingCaloriesWidget).toHaveBeenCalledTimes(1);
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
