import { create } from 'zustand';

export type FastingPlan = '16:8' | '14:10' | '12:12' | '5:2';

export type FastingHistoryEntry = {
  plan: string;
  startTime: string;
  endTime: string;
  completed: boolean;
};

export type FastingState = {
  isFasting: boolean;
  currentPlan: FastingPlan | null;
  startTime: string | null;
  endTime: string | null;
  history: FastingHistoryEntry[];
  startFasting: (plan: FastingPlan) => void;
  stopFasting: () => void;
  getRemainingMs: () => number;
  setFromFirestore: (data: {
    isFasting: boolean;
    currentPlan: string;
    startTime: string;
    endTime: string;
    history: FastingHistoryEntry[];
  }) => void;
};

const PLAN_HOURS: Record<FastingPlan, number> = {
  '16:8': 16,
  '14:10': 14,
  '12:12': 12,
  '5:2': 24,
};

export const useFastingStore = create<FastingState>((set, get) => ({
  isFasting: false,
  currentPlan: null,
  startTime: null,
  endTime: null,
  history: [],

  startFasting: (plan) => {
    if (get().isFasting) return;
    const now = new Date(Date.now());
    const hours = PLAN_HOURS[plan];
    const end = new Date(now.getTime() + hours * 3600000);
    set({
      isFasting: true,
      currentPlan: plan,
      startTime: now.toISOString(),
      endTime: end.toISOString(),
    });
  },

  stopFasting: () => {
    const { currentPlan, startTime, endTime } = get();
    if (!currentPlan || !startTime || !endTime) return;

    const completed = Date.now() >= new Date(endTime).getTime();
    set((state) => ({
      isFasting: false,
      currentPlan: null,
      startTime: null,
      endTime: null,
      history: [
        ...state.history,
        { plan: currentPlan, startTime, endTime, completed },
      ],
    }));
  },

  getRemainingMs: () => {
    const { endTime, isFasting } = get();
    if (!isFasting || !endTime) return 0;
    const remaining = new Date(endTime).getTime() - Date.now();
    return Math.max(0, remaining);
  },

  setFromFirestore: (data) => {
    set({
      isFasting: data.isFasting,
      currentPlan: data.currentPlan as FastingPlan,
      startTime: data.startTime,
      endTime: data.endTime,
      history: data.history || [],
    });
  },
}));
