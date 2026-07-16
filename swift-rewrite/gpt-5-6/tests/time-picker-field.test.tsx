jest.mock('@expo/ui/community/datetime-picker', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return {
    DateTimePicker: ({ onDismiss, onValueChange, testID }: {
      onDismiss?(): void;
      onValueChange?(event: unknown, date: Date): void;
      testID?: string;
    }) => React.createElement(
      Pressable,
      { onPress: onDismiss, testID },
      React.createElement(
        Text,
        {
          onPress: () => onValueChange?.({}, new Date(2001, 0, 1, 23, 15)),
          testID: `${testID}-confirm`,
        },
        'picker',
      ),
    ),
  };
});

jest.mock('@/components/common/platform-symbol', () => ({
  PlatformSymbol: () => null,
}));

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    theme: {
      actionSecondary: '#222222',
      colorScheme: 'dark',
      textPrimary: '#ffffff',
    },
  }),
}));

import { fireEvent, render, screen } from '@testing-library/react-native';

import { TimePickerField } from '@/components/settings/time-picker-field';

describe('android time picker field', () => {
  it('mounts the native dialog only after the field is pressed and unmounts on cancel', async () => {
    await render(
      <TimePickerField
        color="#7b68ee"
        androidIcon="moon"
        icon="moon.fill"
        label="Bedtime"
        minutes={22 * 60}
        onChange={() => undefined}
        platform="android"
      />,
    );

    expect(screen.queryByTestId('settings-bedtime-picker')).toBeNull();
    await fireEvent.press(screen.getByTestId('settings-bedtime'));
    expect(screen.getByTestId('settings-bedtime-picker')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('settings-bedtime-picker'));
    expect(screen.queryByTestId('settings-bedtime-picker')).toBeNull();
  });

  it('closes the dialog and returns the selected time on confirm', async () => {
    const onChange = jest.fn();
    await render(
      <TimePickerField
        color="#ffb347"
        androidIcon="sunny"
        icon="sun.max.fill"
        label="Wake Up"
        minutes={7 * 60}
        onChange={onChange}
        platform="android"
      />,
    );

    await fireEvent.press(screen.getByTestId('settings-wake-up'));
    await fireEvent.press(screen.getByTestId('settings-wake-up-picker-confirm'));

    expect(onChange).toHaveBeenCalledWith(new Date(2001, 0, 1, 23, 15));
    expect(screen.queryByTestId('settings-wake-up-picker')).toBeNull();
  });
});

describe('ios time picker field', () => {
  it('keeps the compact picker mounted inline', async () => {
    await render(
      <TimePickerField
        color="#7b68ee"
        androidIcon="moon"
        icon="moon.fill"
        label="Bedtime"
        minutes={22 * 60}
        onChange={() => undefined}
        platform="ios"
      />,
    );

    expect(screen.getByTestId('settings-bedtime')).toBeTruthy();
  });
});
