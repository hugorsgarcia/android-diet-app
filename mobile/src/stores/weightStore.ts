import { create } from 'zustand';

export type WeightEntry = {
  value: number;
  date: string; // ISO string
};

export type WeightState = {
  entries: WeightEntry[];
  goal: number;
  addEntry: (value: number) => void;
  setGoal: (goal: number) => void;
  setFromFirestore: (entries: WeightEntry[], goal?: number) => void;
  getLatest: () => WeightEntry | null;
};

export const useWeightStore = create<WeightState>((set, get) => ({
  entries: [],
  goal: 0,

  addEntry: (value: number) => {
    const entry: WeightEntry = {
      value,
      date: new Date().toISOString(),
    };
    set((state) => ({
      entries: [...state.entries, entry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    }));
  },

  setGoal: (goal: number) => set({ goal }),

  setFromFirestore: (entries, goal) => {
    set({
      entries: entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      ...(goal !== undefined ? { goal } : {}),
    });
  },

  getLatest: () => {
    const { entries } = get();
    return entries.length > 0 ? entries[entries.length - 1] : null;
  },
}));
