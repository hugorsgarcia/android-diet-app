import { create } from 'zustand';

export type MealType = 'cafe' | 'almoco' | 'lanche' | 'janta';

export type DiaryEntry = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  mealType: MealType;
  source: 'manual' | 'barcode' | 'search';
  barcode?: string;
};

type DiaryTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DiaryState = {
  entries: DiaryEntry[];
  selectedDate: string;
  dailyCalorieGoal: number;
  addEntry: (entry: Omit<DiaryEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  setDate: (date: string) => void;
  setDailyCalorieGoal: (goal: number) => void;
  getTotals: () => DiaryTotals;
  getEntriesByMeal: (mealType: MealType) => DiaryEntry[];
  setFromFirestore: (entries: DiaryEntry[], dailyGoal?: number) => void;
};

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: [],
  selectedDate: getTodayString(),
  dailyCalorieGoal: 2000,

  addEntry: (entry) => {
    const newEntry: DiaryEntry = { ...entry, id: generateId() };
    set((state) => ({ entries: [...state.entries, newEntry] }));
  },

  removeEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
  },

  setDate: (date) => {
    set({ selectedDate: date, entries: [] });
  },

  setDailyCalorieGoal: (goal) => {
    set({ dailyCalorieGoal: goal });
  },

  getTotals: () => {
    const { entries } = get();
    return entries.reduce<DiaryTotals>(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  },

  getEntriesByMeal: (mealType) => {
    return get().entries.filter((e) => e.mealType === mealType);
  },

  setFromFirestore: (entries, dailyGoal) => {
    set({
      entries,
      ...(dailyGoal !== undefined ? { dailyCalorieGoal: dailyGoal } : {}),
    });
  },
}));
