import { create } from 'zustand';

type DrawerState = {
  closeDrawer: () => void;
  isOpen: boolean;
  openDrawer: () => void;
  setDrawerOpen: (isOpen: boolean) => void;
  toggleDrawer: () => void;
};

export const useDrawerStore = create<DrawerState>((set) => ({
  closeDrawer: () => {
    set({ isOpen: false });
  },
  isOpen: false,
  openDrawer: () => {
    set({ isOpen: true });
  },
  setDrawerOpen: (isOpen) => {
    set({ isOpen });
  },
  toggleDrawer: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },
}));
