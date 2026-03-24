import { mapDietToDiaryEntries, mapMealNameToType } from '../dietToDiary';

describe('mapMealNameToType', () => {
  it('should map "Café da Manhã" to "cafe"', () => {
    expect(mapMealNameToType('Café da Manhã')).toBe('cafe');
  });

  it('should map "Almoço" to "almoco"', () => {
    expect(mapMealNameToType('Almoço')).toBe('almoco');
  });

  it('should map "Jantar" to "janta"', () => {
    expect(mapMealNameToType('Jantar')).toBe('janta');
  });
});

describe('mapDietToDiaryEntries', () => {
  const sampleDiet = {
    calorias_diarias: 2000,
    refeicoes: [
      { horario: '07:00', nome: 'Café da Manhã', alimentos: ['Ovo cozido', 'Pão integral'] },
      { horario: '12:00', nome: 'Almoço', alimentos: ['Frango grelhado', 'Arroz integral', 'Salada'] },
    ],
  };

  it('should create one entry per food item', () => {
    const entries = mapDietToDiaryEntries(sampleDiet);
    expect(entries).toHaveLength(5);
  });

  it('should distribute total calories across all entries', () => {
    const entries = mapDietToDiaryEntries(sampleDiet);
    const total = entries.reduce((sum: number, e: any) => sum + e.calories, 0);
    expect(total).toBeCloseTo(2000, -1);
  });
});
