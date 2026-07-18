// focused accessibility assertions from the task-13 audit: accessible
// names and roles for the primary controls, the analyzing announcement,
// and the dynamic type caps that keep dense rows from clipping at
// accessibility text sizes.
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MealList } from '../../src/components/dashboard/MealList';
import { NutritionSummary } from '../../src/components/dashboard/NutritionSummary';
import { ScanButton } from '../../src/components/dashboard/ScanButton';
import { AnalyzingOverlay } from '../../src/components/scan/AnalyzingOverlay';
import { ErrorCard } from '../../src/components/scan/ErrorCard';
import { ResultCard } from '../../src/components/scan/ResultCard';
import { getDaySummary, type Meal } from '../../src/domain/nutrition';
import type { ScanSuccess } from '../../src/domain/scan-contract';
import { fontScaleCap } from '../../src/theme/tokens';

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 430, height: 932 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const MEAL: Meal = {
  id: 'scan-1-1',
  food: 'Grilled chicken salad bowl',
  calories: 620,
  protein_g: 48,
  carbs_g: 48,
  fat_g: 26,
  confidence: 0.88,
  thumbnailUri: 'file:///cache/prepared-salad.jpg',
  loggedAt: 1700000000000,
};

const RESULT: ScanSuccess = {
  food: 'Grilled chicken salad bowl',
  calories: 620,
  protein_g: 48,
  carbs_g: 48,
  fat_g: 26,
  confidence: 0.88,
};

function withSafeArea(children: ReactNode) {
  return (
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      {children}
    </SafeAreaProvider>
  );
}

describe('accessibility audit', () => {
  it('exposes the scan action as a named button with a capped label', async () => {
    await render(<ScanButton onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Scan meal' })).toBeTruthy();
    expect(screen.getByText('Scan meal').props.maxFontSizeMultiplier).toBe(
      fontScaleCap.pill,
    );
  });

  it('exposes accept and discard as named buttons and locks accept once accepted', async () => {
    await render(
      withSafeArea(
        <ResultCard
          result={RESULT}
          accepted
          onAccept={jest.fn()}
          onDiscard={jest.fn()}
        />,
      ),
    );

    expect(screen.getByRole('button', { name: 'Discard' })).toBeTruthy();
    const accept = screen.getByRole('button', { name: 'Accept' });
    expect(accept.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('groups the estimated calories into one voiceover element and caps dense result text', async () => {
    await render(
      withSafeArea(
        <ResultCard
          result={RESULT}
          accepted={false}
          onAccept={jest.fn()}
          onDiscard={jest.fn()}
        />,
      ),
    );

    expect(screen.getByLabelText('620 estimated calories')).toBeTruthy();
    expect(screen.getByLabelText('Protein 48 grams')).toBeTruthy();
    expect(screen.getByLabelText('Carbs 48 grams')).toBeTruthy();
    expect(screen.getByLabelText('Fat 26 grams')).toBeTruthy();
    expect(screen.getByText('620').props.maxFontSizeMultiplier).toBe(
      fontScaleCap.display,
    );
    for (const grams of screen.getAllByText('48g')) {
      expect(grams.props.maxFontSizeMultiplier).toBe(fontScaleCap.dense);
    }
  });

  it('names the correct recovery action on every error card', async () => {
    const variants = [
      { variant: 'not_food', action: 'Try another photo' },
      { variant: 'network', action: 'Retry analysis' },
      { variant: 'analysis', action: 'Retry analysis' },
    ] as const;

    for (const { variant, action } of variants) {
      await render(
        withSafeArea(
          <ErrorCard
            variant={variant}
            onPrimaryAction={jest.fn()}
            onDiscard={jest.fn()}
          />,
        ),
      );

      expect(screen.getByRole('button', { name: action })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Discard' })).toBeTruthy();
      await screen.unmount();
    }
  });

  it('announces the analyzing state and labels the live region', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);

    await render(withSafeArea(<AnalyzingOverlay />));

    expect(announce).toHaveBeenCalledWith('Analyzing your meal');
    // the label appears on the live-region container and as the pill text
    expect(
      screen.getAllByLabelText('Analyzing your meal').length,
    ).toBeGreaterThan(0);
    announce.mockRestore();
  });

  it('labels meal rows completely and caps their dense row text', async () => {
    await render(<MealList meals={[MEAL]} />);

    expect(
      screen.getByLabelText(
        'Grilled chicken salad bowl, 620 calories, 48 grams protein, ' +
          '48 grams carbs, 26 grams fat',
      ),
    ).toBeTruthy();
    expect(screen.getByText('kcal').props.maxFontSizeMultiplier).toBe(
      fontScaleCap.dense,
    );
    expect(
      screen.getByText('Grilled chicken salad bowl').props
        .maxFontSizeMultiplier,
    ).toBe(fontScaleCap.dense);
  });

  it('caps the oversized remaining-calorie numeral so the ring stays on-card', async () => {
    await render(<NutritionSummary summary={getDaySummary([MEAL])} />);

    expect(screen.getByLabelText('1380 calories left today')).toBeTruthy();
    expect(screen.getByText('1380').props.maxFontSizeMultiplier).toBe(
      fontScaleCap.display,
    );
  });
});
