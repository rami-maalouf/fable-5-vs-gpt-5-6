// focused motion-state tests for the animated dashboard numerals: exact
// first paint, previous-to-new counting, mid-flight retargeting, and the
// reduce-motion immediate update.
import { render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Text } from 'react-native';

import { AnimatedNumber } from '../../src/components/dashboard/AnimatedNumber';

function Harness({ value }: { value: number }) {
  return (
    <Text>
      <AnimatedNumber
        value={value}
        format={(shown) => String(Math.round(shown))}
      />
    </Text>
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

it('shows the exact value immediately on first mount', async () => {
  await render(<Harness value={2000} />);

  expect(screen.getByText('2000')).toBeOnTheScreen();
});

it('animates from the previously shown value and lands on the exact target', async () => {
  await render(<Harness value={2000} />);

  await screen.rerender(<Harness value={1380} />);

  // the count starts from the previous value, not the new target
  expect(screen.queryByText('1380')).not.toBeOnTheScreen();

  await waitFor(
    () => {
      expect(screen.getByText('1380')).toBeOnTheScreen();
    },
    { timeout: 3000 },
  );
});

it('retargets mid-flight and settles on the latest exact value', async () => {
  await render(<Harness value={2000} />);

  // rapid consecutive accepts: each new summary replaces the target before
  // the previous animation finishes; the display must settle on the last one
  await screen.rerender(<Harness value={1380} />);
  await screen.rerender(<Harness value={620} />);
  await screen.rerender(<Harness value={-420} />);

  await waitFor(
    () => {
      expect(screen.getByText('-420')).toBeOnTheScreen();
    },
    { timeout: 3000 },
  );
});

it('updates immediately when reduce motion is enabled', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);

  await render(<Harness value={2000} />);

  // wait for the async reduce-motion read to land in the hook
  await waitFor(() => {
    expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled();
  });

  await screen.rerender(<Harness value={1380} />);

  // no count-up frames: the exact new value is shown at once
  expect(screen.getByText('1380')).toBeOnTheScreen();
});
