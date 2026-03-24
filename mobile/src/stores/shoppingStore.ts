import { create } from 'zustand';

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
};

type Meal = {
  horario: string;
  nome: string;
  alimentos: string[];
};

export type ShoppingState = {
  items: ShoppingItem[];
  setFromDiet: (meals: Meal[]) => void;
  toggleItem: (id: string) => void;
  getProgress: () => { checked: number; total: number };
  clearAll: () => void;
};

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useShoppingStore = create<ShoppingState>((set, get) => ({
  items: [],

  setFromDiet: (meals) => {
    const seen = new Set<string>();
    const items: ShoppingItem[] = [];

    for (const meal of meals) {
      for (const alimento of meal.alimentos) {
        const normalized = alimento.toLowerCase().trim();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          items.push({ id: generateId(), name: alimento, checked: false });
        }
      }
    }

    set({ items });
  },

  toggleItem: (id) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }));
  },

  getProgress: () => {
    const { items } = get();
    return {
      checked: items.filter((i) => i.checked).length,
      total: items.length,
    };
  },

  clearAll: () => {
    set({ items: [] });
  },
}));
