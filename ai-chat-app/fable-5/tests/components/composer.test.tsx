// note: @testing-library/react-native v14 has an async api - render, events,
// and rerender must all be awaited

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-symbols', () => {
  const { View } = jest.requireActual('react-native');
  return { SymbolView: (props: object) => <View {...props} /> };
});

import * as Haptics from 'expo-haptics';

import { Composer } from '@/components/chat/Composer';

async function setup(overrides: Partial<React.ComponentProps<typeof Composer>> = {}) {
  const onSend = jest.fn();
  const onStop = jest.fn();
  const view = await render(
    <Composer generating={false} onSend={onSend} onStop={onStop} {...overrides} />,
  );
  return { onSend, onStop, view };
}

describe('Composer', () => {
  it('disables send when the input is empty', async () => {
    const { onSend, view } = await setup();
    await fireEvent.press(view.getByTestId('composer-send'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send whitespace-only input', async () => {
    const { onSend, view } = await setup();
    await fireEvent.changeText(view.getByTestId('composer-input'), '   ');
    await fireEvent.press(view.getByTestId('composer-send'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends trimmed text and clears the input', async () => {
    const { onSend, view } = await setup();
    await fireEvent.changeText(view.getByTestId('composer-input'), '  hello nova ');
    await fireEvent.press(view.getByTestId('composer-send'));
    expect(onSend).toHaveBeenCalledWith('hello nova');
    expect(view.getByTestId('composer-input').props.value).toBe('');
  });

  it('fires a light haptic on send', async () => {
    const { view } = await setup();
    await fireEvent.changeText(view.getByTestId('composer-input'), 'hi');
    await fireEvent.press(view.getByTestId('composer-send'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });

  it('shows stop instead of send while generating, and stop works', async () => {
    const { onSend, onStop, view } = await setup({ generating: true });
    expect(view.queryByTestId('composer-send')).toBeNull();
    await fireEvent.press(view.getByTestId('composer-stop'));
    expect(onStop).toHaveBeenCalled();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send while generating even with text present', async () => {
    const { onSend, view } = await setup({ generating: true });
    await fireEvent.changeText(view.getByTestId('composer-input'), 'queued message');
    expect(view.queryByTestId('composer-send')).toBeNull();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not restore cleared text when generating flips off (no restore on error)', async () => {
    const onSend = jest.fn();
    const onStop = jest.fn();
    const view = await render(
      <Composer generating={false} onSend={onSend} onStop={onStop} />,
    );
    await fireEvent.changeText(view.getByTestId('composer-input'), 'will fail');
    await fireEvent.press(view.getByTestId('composer-send'));
    await view.rerender(<Composer generating={true} onSend={onSend} onStop={onStop} />);
    await view.rerender(<Composer generating={false} onSend={onSend} onStop={onStop} />);
    expect(view.getByTestId('composer-input').props.value).toBe('');
  });
});
