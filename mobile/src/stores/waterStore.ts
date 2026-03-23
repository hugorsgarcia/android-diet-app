import { create } from 'zustand';

export type WaterState = {
  glasses: number;
  goal: number;
  date: string;
  addGlass: () => void;
  resetDaily: () => void;
  setFromFirestore: (data: { glasses: number; goal: number; date: string }) => void;
};

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const useWaterStore = create<WaterState>((set, get) => ({
  glasses: 0,
  goal: 8,
  date: getTodayString(),

  addGlass: () => {
    const today = getTodayString();
    const state = get();

    // Se mudou de dia, reseta automaticamente
    if (state.date !== today) {
      set({ glasses: 1, date: today });
    } else {
      set({ glasses: Math.min(state.glasses + 1, state.goal) });
    }
  },

  resetDaily: () => {
    set({ glasses: 0, date: getTodayString() });
  },

  setFromFirestore: (data) => {
    const today = getTodayString();
    // Só carrega se for do mesmo dia, senão reseta
    if (data.date === today) {
      set({ glasses: data.glasses, goal: data.goal, date: data.date });
    } else {
      set({ glasses: 0, goal: data.goal || 8, date: today });
    }
  },
}));
