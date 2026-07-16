import { act, create } from 'react-test-renderer';
import type { ComponentProps } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, jest } from '@jest/globals';

import { ModelPicker } from '@/components/chat/ModelPicker';

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

jest.mock('@expo/ui/community/menu', () => {
  const { View } = require('react-native');

  return {
    MenuView: ({ children, ...props }: Record<string, unknown>) => (
      <View {...props}>{children}</View>
    ),
  };
});

async function renderModelPicker(props: ComponentProps<typeof ModelPicker>) {
  let tree: ReactTestRenderer | undefined;

  await act(async () => {
    tree = create(<ModelPicker {...props} />);
  });

  return tree!;
}

describe('ModelPicker', () => {
  it('renders allowlisted model actions with the current model checked', async () => {
    const tree = await renderModelPicker({
      model: 'gpt-5.6-sol',
      onChange: jest.fn(),
    });
    const menu = tree.root.findByProps({ testID: 'model-picker-menu' });

    expect(menu.props.actions).toEqual([
      { id: 'gpt-5.6-luna', state: 'off', title: 'gpt-5.6-luna' },
      { id: 'gpt-5.6-sol', state: 'on', title: 'gpt-5.6-sol' },
      { id: 'gpt-5.6-terra', state: 'off', title: 'gpt-5.6-terra' },
    ]);
  });

  it('emits only allowlisted model changes', async () => {
    const onChange = jest.fn();
    const tree = await renderModelPicker({
      model: 'gpt-5.6-luna',
      onChange,
    });
    const menu = tree.root.findByProps({ testID: 'model-picker-menu' });

    await act(async () => {
      menu.props.onPressAction({ nativeEvent: { event: 'gpt-4.1' } });
      menu.props.onPressAction({ nativeEvent: { event: 'gpt-5.6-luna' } });
      menu.props.onPressAction({ nativeEvent: { event: 'gpt-5.6-terra' } });
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('gpt-5.6-terra');
  });
});
