import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AnalyzingOverlay } from '../../src/components/scan/AnalyzingOverlay';
import { ResultCard } from '../../src/components/scan/ResultCard';
import { ScanPhotoStage } from '../../src/components/scan/ScanPhotoStage';

const result = {
  food: 'Fried chicken',
  calories: 988,
  protein_g: 54,
  carbs_g: 39,
  fat_g: 60,
  confidence: 0.99,
};

describe('scan result UI', () => {
  it('uses an honest indeterminate overlay over the prepared photo', async () => {
    await render(
      <ScanPhotoStage photoUri="file:///prepared.jpg">
        <AnalyzingOverlay />
      </ScanPhotoStage>,
    );

    expect(screen.getByLabelText('Prepared meal photo')).toHaveProp('source', [
      { uri: 'file:///prepared.jpg' },
    ]);
    expect(screen.getByText('Analyzing your meal')).toBeOnTheScreen();
    expect(screen.getByText('Estimating calories and macros')).toBeOnTheScreen();
    expect(screen.queryByText(/%/)).not.toBeOnTheScreen();
  });

  it('reveals every estimate field without changing the photo URI or crop', async () => {
    const view = await render(
      <ScanPhotoStage photoUri="file:///prepared.jpg">
        <AnalyzingOverlay />
      </ScanPhotoStage>,
    );

    const analyzingPhoto = screen.getByLabelText('Prepared meal photo');
    expect(analyzingPhoto).toHaveProp('contentFit', 'cover');

    await view.rerender(
      <ScanPhotoStage photoUri="file:///prepared.jpg">
        <ResultCard
          accepting={false}
          onAccept={jest.fn()}
          onDiscard={jest.fn()}
          result={result}
        />
      </ScanPhotoStage>,
    );

    const resultPhoto = screen.getByLabelText('Prepared meal photo');
    expect(resultPhoto).toHaveProp('source', [{ uri: 'file:///prepared.jpg' }]);
    expect(resultPhoto).toHaveProp('contentFit', 'cover');
    expect(screen.getByText('AI ESTIMATE')).toBeOnTheScreen();
    expect(screen.getByText('Fried chicken')).toBeOnTheScreen();
    expect(screen.getByText('988')).toBeOnTheScreen();
    expect(screen.getByText('calories')).toBeOnTheScreen();
    expect(screen.getByText('54 g')).toBeOnTheScreen();
    expect(screen.getByText('39 g')).toBeOnTheScreen();
    expect(screen.getByText('60 g')).toBeOnTheScreen();
    expect(screen.queryByText('99%')).not.toBeOnTheScreen();

    const accept = screen.getByRole('button', { name: 'Accept estimate' });
    const discard = screen.getByRole('button', { name: 'Discard estimate' });
    expect(StyleSheet.flatten(accept.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(StyleSheet.flatten(discard.props.style).minHeight).toBeGreaterThanOrEqual(44);
  });
});
