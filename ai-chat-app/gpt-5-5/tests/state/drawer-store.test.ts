import { beforeEach, describe, expect, it } from '@jest/globals';

import { useDrawerStore } from '@/state/drawer';

describe('drawer store', () => {
  beforeEach(() => {
    useDrawerStore.getState().closeDrawer();
  });

  it('opens, closes, and toggles the drawer', () => {
    expect(useDrawerStore.getState().isOpen).toBe(false);

    useDrawerStore.getState().openDrawer();
    expect(useDrawerStore.getState().isOpen).toBe(true);

    useDrawerStore.getState().toggleDrawer();
    expect(useDrawerStore.getState().isOpen).toBe(false);

    useDrawerStore.getState().setDrawerOpen(true);
    expect(useDrawerStore.getState().isOpen).toBe(true);

    useDrawerStore.getState().closeDrawer();
    expect(useDrawerStore.getState().isOpen).toBe(false);
  });
});
