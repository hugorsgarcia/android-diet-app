import { create } from 'zustand';

export type StreakState = {
  current: number;
  best: number;
  lastActiveDate: string;
  recordActivity: () => void;
  setFromFirestore: (data: { current: number; best: number; lastActiveDate: string }) => void;
};

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  current: 0,
  best: 0,
  lastActiveDate: '',

  recordActivity: () => {
    const today = getTodayString();
    const yesterday = getYesterdayString();
    const state = get();

    // Já registrou hoje, ignora
    if (state.lastActiveDate === today) return;

    let newCurrent: number;
    if (state.lastActiveDate === yesterday) {
      // Dia consecutivo: incrementa
      newCurrent = state.current + 1;
    } else {
      // Perdeu a sequência: começa de 1
      newCurrent = 1;
    }

    const newBest = Math.max(state.best, newCurrent);
    set({ current: newCurrent, best: newBest, lastActiveDate: today });
  },

  setFromFirestore: (data) => {
    set({
      current: data.current || 0,
      best: data.best || 0,
      lastActiveDate: data.lastActiveDate || '',
    });
  },
}));
