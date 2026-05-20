import { create } from 'zustand';

interface ChildrenSheetStore {
  pendingOpen: boolean;
  requestOpen: () => void;
  consume: () => void;
}

export const useChildrenSheetStore = create<ChildrenSheetStore>(set => ({
  pendingOpen: false,
  requestOpen: () => set({ pendingOpen: true }),
  consume: () => set({ pendingOpen: false }),
}));
