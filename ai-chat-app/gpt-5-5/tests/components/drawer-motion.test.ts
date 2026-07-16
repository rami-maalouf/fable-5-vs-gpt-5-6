import { describe, expect, it } from '@jest/globals';

import {
  DRAWER_CLOSE_TIMING_CONFIG,
  DRAWER_OPEN_TIMING_CONFIG,
} from '@/components/drawer/drawerMotion';

describe('drawer motion', () => {
  it('opens quickly and closes a little faster for a native-feeling transition', () => {
    expect(DRAWER_OPEN_TIMING_CONFIG.duration).toBe(200);
    expect(DRAWER_CLOSE_TIMING_CONFIG.duration).toBe(150);
  });
});
