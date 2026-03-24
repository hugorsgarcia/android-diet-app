import { useDiaryStore, MealType, DiaryEntry } from '../diaryStore';

// Reset store antes de cada teste
beforeEach(() => {
  useDiaryStore.setState({
    entries: [],
    selectedDate: new Date().toISOString().split('T')[0],
    dailyCalorieGoal: 2000,
  });
});

describe('diaryStore', () => {
  describe('addEntry', () => {
    it('deve adicionar uma entry ao diário', () => {
      const entry: Omit<DiaryEntry, 'id'> = {
        name: 'Banana',
        calories: 89,
        protein: 1.1,
        carbs: 22.8,
        fat: 0.3,
        quantity: 100,
        unit: 'g',
        mealType: 'cafe',
        source: 'search',
      };

      useDiaryStore.getState().addEntry(entry);

      const entries = useDiaryStore.getState().entries;
      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe('Banana');
      expect(entries[0].id).toBeDefined();
    });

    it('deve gerar IDs únicos para cada entry', () => {
      const entry = {
        name: 'Arroz',
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        quantity: 100,
        unit: 'g',
        mealType: 'almoco' as MealType,
        source: 'search' as const,
      };

      useDiaryStore.getState().addEntry(entry);
      useDiaryStore.getState().addEntry(entry);

      const entries = useDiaryStore.getState().entries;
      expect(entries[0].id).not.toBe(entries[1].id);
    });
  });

  describe('removeEntry', () => {
    it('deve remover uma entry pelo ID', () => {
      useDiaryStore.getState().addEntry({
        name: 'Frango',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        quantity: 100,
        unit: 'g',
        mealType: 'almoco',
        source: 'manual',
      });

      const id = useDiaryStore.getState().entries[0].id;
      useDiaryStore.getState().removeEntry(id);

      expect(useDiaryStore.getState().entries).toHaveLength(0);
    });

    it('não deve alterar o estado se o ID não existir', () => {
      useDiaryStore.getState().addEntry({
        name: 'Ovo',
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fat: 11,
        quantity: 50,
        unit: 'g',
        mealType: 'cafe',
        source: 'manual',
      });

      useDiaryStore.getState().removeEntry('id-inexistente');
      expect(useDiaryStore.getState().entries).toHaveLength(1);
    });
  });

  describe('cálculo de totais', () => {
    it('deve calcular total de calorias corretamente', () => {
      useDiaryStore.getState().addEntry({
        name: 'Banana',
        calories: 89,
        protein: 1.1,
        carbs: 22.8,
        fat: 0.3,
        quantity: 100,
        unit: 'g',
        mealType: 'cafe',
        source: 'search',
      });

      useDiaryStore.getState().addEntry({
        name: 'Frango',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        quantity: 100,
        unit: 'g',
        mealType: 'almoco',
        source: 'search',
      });

      const totals = useDiaryStore.getState().getTotals();
      expect(totals.calories).toBe(254);
      expect(totals.protein).toBeCloseTo(32.1);
      expect(totals.carbs).toBeCloseTo(22.8);
      expect(totals.fat).toBeCloseTo(3.9);
    });

    it('deve retornar zeros quando não há entries', () => {
      const totals = useDiaryStore.getState().getTotals();
      expect(totals.calories).toBe(0);
      expect(totals.protein).toBe(0);
      expect(totals.carbs).toBe(0);
      expect(totals.fat).toBe(0);
    });
  });

  describe('getEntriesByMeal', () => {
    it('deve filtrar entries por tipo de refeição', () => {
      useDiaryStore.getState().addEntry({
        name: 'Café',
        calories: 2,
        protein: 0,
        carbs: 0,
        fat: 0,
        quantity: 200,
        unit: 'ml',
        mealType: 'cafe',
        source: 'manual',
      });

      useDiaryStore.getState().addEntry({
        name: 'Arroz',
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        quantity: 100,
        unit: 'g',
        mealType: 'almoco',
        source: 'search',
      });

      const cafeEntries = useDiaryStore.getState().getEntriesByMeal('cafe');
      const almocoEntries = useDiaryStore.getState().getEntriesByMeal('almoco');

      expect(cafeEntries).toHaveLength(1);
      expect(cafeEntries[0].name).toBe('Café');
      expect(almocoEntries).toHaveLength(1);
      expect(almocoEntries[0].name).toBe('Arroz');
    });
  });

  describe('setDate', () => {
    it('deve alterar a data selecionada e limpar entries', () => {
      useDiaryStore.getState().addEntry({
        name: 'Banana',
        calories: 89,
        protein: 1.1,
        carbs: 22.8,
        fat: 0.3,
        quantity: 100,
        unit: 'g',
        mealType: 'cafe',
        source: 'search',
      });

      useDiaryStore.getState().setDate('2026-03-20');

      expect(useDiaryStore.getState().selectedDate).toBe('2026-03-20');
      expect(useDiaryStore.getState().entries).toHaveLength(0);
    });
  });

  describe('setDailyCalorieGoal', () => {
    it('deve atualizar a meta de calorias diária', () => {
      useDiaryStore.getState().setDailyCalorieGoal(1800);
      expect(useDiaryStore.getState().dailyCalorieGoal).toBe(1800);
    });
  });
});
