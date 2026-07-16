import { describe, expect, it, jest } from '@jest/globals';
import type { ComponentProps } from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { StyleSheet, TextInput } from 'react-native';

import { CHAT_INPUT_NATIVE_ID, Composer } from '@/components/chat/Composer';

const mockImpactAsync = jest.fn();

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'Light',
  },
  impactAsync: (...args: unknown[]) => mockImpactAsync(...args),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

async function renderComposer(props: ComponentProps<typeof Composer>) {
  let tree: ReactTestRenderer | undefined;

  await act(async () => {
    tree = create(<Composer {...props} />);
  });

  return tree!;
}

describe('Composer', () => {
  it('keeps send disabled until the input has non-whitespace text', async () => {
    const tree = await renderComposer({
      isGenerating: false,
      onSend: jest.fn(),
      onStop: jest.fn(),
    });

    expect(tree.root.findByProps({ accessibilityLabel: 'send message' }).props.disabled).toBe(
      true,
    );

    await act(async () => {
      tree.root.findByType(TextInput).props.onChangeText('   ');
    });

    expect(tree.root.findByProps({ accessibilityLabel: 'send message' }).props.disabled).toBe(
      true,
    );

    await act(async () => {
      tree.root.findByType(TextInput).props.onChangeText('hello nova');
    });

    expect(tree.root.findByProps({ accessibilityLabel: 'send message' }).props.disabled).toBe(
      false,
    );
  });

  it('clears the input immediately when sending', async () => {
    const onSend = jest.fn();
    const tree = await renderComposer({
      isGenerating: false,
      onSend,
      onStop: jest.fn(),
    });

    await act(async () => {
      tree.root.findByType(TextInput).props.onChangeText('  hello nova  ');
    });
    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'send message' }).props.onPress();
    });

    expect(onSend).toHaveBeenCalledWith('hello nova');
    expect(mockImpactAsync).toHaveBeenCalledWith('Light');
    expect(tree.root.findByType(TextInput).props.value).toBe('');
  });

  it('swaps send for stop while generating', async () => {
    const onSend = jest.fn();
    const onStop = jest.fn();
    const tree = await renderComposer({
      isGenerating: true,
      onSend,
      onStop,
    });

    expect(() => tree.root.findByProps({ accessibilityLabel: 'send message' })).toThrow();
    expect(tree.root.findByProps({ accessibilityLabel: 'stop generating' })).toBeTruthy();

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'stop generating' }).props.onPress();
    });

    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('uses a capped multiline text input', async () => {
    const tree = await renderComposer({
      isGenerating: false,
      onSend: jest.fn(),
      onStop: jest.fn(),
    });

    const input = tree.root.findByType(TextInput);

    expect(input.props.multiline).toBe(true);
    expect(input.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          maxHeight: 128,
        }),
      ]),
    );
  });

  it('exposes a stable native id for keyboard gesture coordination', async () => {
    const tree = await renderComposer({
      isGenerating: false,
      onSend: jest.fn(),
      onStop: jest.fn(),
    });

    expect(CHAT_INPUT_NATIVE_ID).toBe('nova-chat-input');
    expect(tree.root.findByType(TextInput).props.nativeID).toBe(CHAT_INPUT_NATIVE_ID);
  });

  it('keeps composer action controls at least 44 points wide and tall', async () => {
    const tree = await renderComposer({
      isGenerating: false,
      onSend: jest.fn(),
      onStop: jest.fn(),
    });
    const sendButton = tree.root.findByProps({ accessibilityLabel: 'send message' });
    const sendButtonStyle = StyleSheet.flatten(sendButton.props.style({ pressed: false }));

    expect(sendButtonStyle.width).toBeGreaterThanOrEqual(44);
    expect(sendButtonStyle.height).toBeGreaterThanOrEqual(44);

    await act(async () => {
      tree.update(<Composer isGenerating onSend={jest.fn()} onStop={jest.fn()} />);
    });

    const stopButton = tree.root.findByProps({ accessibilityLabel: 'stop generating' });
    const stopButtonStyle = StyleSheet.flatten(stopButton.props.style({ pressed: false }));

    expect(stopButtonStyle.width).toBeGreaterThanOrEqual(44);
    expect(stopButtonStyle.height).toBeGreaterThanOrEqual(44);
  });
});
