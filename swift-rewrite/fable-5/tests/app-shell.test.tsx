import { render } from '@testing-library/react-native';

import DashboardScreen from '@/app/(tabs)/index';

describe('app shell', () => {
  test('dashboard placeholder renders', async () => {
    const { getByText } = await render(<DashboardScreen />);
    getByText('Dashboard');
  });
});
