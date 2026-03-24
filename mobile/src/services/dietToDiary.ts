import { MealType } from '../stores/diaryStore';

type DietMeal = {
  horario: string;
  nome: string;
  alimentos: string[];
};

type DietData = {
  calorias_diarias: number;
  refeicoes: DietMeal[];
};

const MEAL_NAME_MAP: Record<string, MealType> = {
  'café da manhã': 'cafe',
  'café': 'cafe',
  'desjejum': 'cafe',
  'almoço': 'almoco',
  'lanche': 'lanche',
  'lanche da tarde': 'lanche',
  'janta': 'janta',
  'jantar': 'janta',
  'ceia': 'janta',
};

export function mapMealNameToType(mealName: string): MealType {
  const normalized = mealName.toLowerCase().trim();
  for (const [key, value] of Object.entries(MEAL_NAME_MAP)) {
    if (normalized.includes(key)) return value;
  }
  return 'lanche';
}

export function mapDietToDiaryEntries(diet: DietData) {
  const totalFoods = diet.refeicoes.reduce((sum, r) => sum + r.alimentos.length, 0);
  if (totalFoods === 0) return [];

  const caloriesPerFood = diet.calorias_diarias / totalFoods;
  // Estimativa padrão para macros (30% prot, 40% carb, 30% fat)
  const proteinPerFood = (diet.calorias_diarias * 0.3 / 4) / totalFoods;
  const carbsPerFood = (diet.calorias_diarias * 0.4 / 4) / totalFoods;
  const fatPerFood = (diet.calorias_diarias * 0.3 / 9) / totalFoods;

  const entries: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    unit: string;
    mealType: MealType;
    source: 'manual';
  }> = [];

  for (const refeicao of diet.refeicoes) {
    const mealType = mapMealNameToType(refeicao.nome);
    for (const alimento of refeicao.alimentos) {
      entries.push({
        name: alimento,
        calories: Math.round(caloriesPerFood),
        protein: Math.round(proteinPerFood),
        carbs: Math.round(carbsPerFood),
        fat: Math.round(fatPerFood),
        quantity: 1,
        unit: 'porção',
        mealType,
        source: 'manual',
      });
    }
  }

  return entries;
}
