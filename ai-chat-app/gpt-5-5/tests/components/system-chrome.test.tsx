import { describe, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';

import { SystemChrome } from '@/components/SystemChrome';

const mockSetBackgroundColorAsync = jest.fn();

jest.mock('expo-status-bar', () => {
  const { View } = require('react-native');

  return {
    StatusBar: (props: Record<string, unknown>) => (
      <View testID="status-bar" {...props} />
    ),
  };
});

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: (...args: unknown[]) => mockSetBackgroundColorAsync(...args),
}));

describe('SystemChrome', () => {
  it('uses an animated auto status bar and syncs the root background color', async () => {
    let tree: ReturnType<typeof create> | undefined;

    await act(async () => {
      tree = create(<SystemChrome backgroundColor="#ffffff" />);
    });

    const statusBar = tree!.root.findByProps({ testID: 'status-bar' });

    expect(statusBar.props.animated).toBe(true);
    expect(statusBar.props.style).toBe('auto');
    expect(mockSetBackgroundColorAsync).toHaveBeenCalledWith('#ffffff');
  });
});
