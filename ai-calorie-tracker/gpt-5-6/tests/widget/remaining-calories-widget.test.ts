const mockCreateWidget = jest.fn();
const mockUpdateSnapshot = jest.fn();

jest.mock('@expo/ui/swift-ui', () => ({
  Spacer: 'Spacer',
  Text: 'Text',
  VStack: 'VStack',
}));

jest.mock('@expo/ui/swift-ui/modifiers', () => ({
  containerBackground: jest.fn(),
  font: jest.fn(),
  foregroundStyle: jest.fn(),
  padding: jest.fn(),
}));

jest.mock('expo-widgets', () => ({
  createWidget: (...arguments_: unknown[]) => mockCreateWidget(...arguments_),
}));

mockCreateWidget.mockReturnValue({ updateSnapshot: mockUpdateSnapshot });

const RemainingCaloriesWidget = require('../../widgets/RemainingCaloriesWidget').default;
const { updateRemainingCaloriesWidget } = require('../../src/services/widget.ios');

describe('RemainingCaloriesWidget', () => {
  it('registers with the exact configured widget name', () => {
    expect(mockCreateWidget).toHaveBeenCalledWith(
      'RemainingCaloriesWidget',
      expect.any(String),
    );
    expect(RemainingCaloriesWidget).toEqual({ updateSnapshot: mockUpdateSnapshot });
  });

  it('publishes the remaining calorie snapshot', () => {
    updateRemainingCaloriesWidget(1_420);

    expect(mockUpdateSnapshot).toHaveBeenCalledWith({ caloriesRemaining: 1_420 });
  });
});
