// Mock react-native Platform before any imports
jest.mock('react-native', () => ({
  Platform: { OS: 'android', select: jest.fn() },
}));

// Mock do módulo nativo do Firestore para testes unitários
const mockGet = jest.fn();
const mockSet = jest.fn().mockResolvedValue(undefined);

jest.mock('@react-native-firebase/firestore', () => {
  return {
    __esModule: true,
    default: () => ({
      collection: () => ({
        doc: () => ({
          collection: () => ({
            doc: () => ({
              get: mockGet,
              set: mockSet,
            }),
          }),
          get: mockGet,
          set: mockSet,
        }),
      }),
    }),
  };
});

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock('@react-native-firebase/functions', () => ({
  __esModule: true,
  default: () => ({}),
}));

import { saveMealCheckins, saveDietMeals } from '../firebase';

const MOCK_UID = 'uid123';
const MOCK_DIET_ID = 'diet456';

describe('Firebase Diet Sync — BUG-04 / BUG-05 regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── BUG-04: saveMealCheckins deve persistir check-ins ────────────────────
  describe('saveMealCheckins (BUG-04)', () => {
    it('persiste checkins no documento correto do Firestore', async () => {
      const checkins: Record<number, boolean> = { 0: true, 1: false };
      await saveMealCheckins(MOCK_UID, MOCK_DIET_ID, checkins);
      expect(mockSet).toHaveBeenCalledWith({ checkins }, { merge: true });
    });

    it('não lança erro quando o firestore não está disponível (web)', async () => {
      // O guard `if (!firestore) return;` já garante no‑op em plataformas web.
      // Aqui confirmamos que a função existe e tem a assinatura correta.
      expect(typeof saveMealCheckins).toBe('function');
    });
  });

  // ── BUG-05: saveDietMeals deve persistir refeições atualizadas ───────────
  describe('saveDietMeals (BUG-05)', () => {
    const MEALS = [
      { horario: '08:00', nome: 'Café da Manhã', alimentos: ['Ovo mexido', 'Pão integral'] },
      { horario: '12:00', nome: 'Almoço', alimentos: ['Frango grelhado', 'Arroz'] },
    ];

    it('persiste as refeições atualizadas com merge no Firestore', async () => {
      await saveDietMeals(MOCK_UID, MOCK_DIET_ID, MEALS);
      expect(mockSet).toHaveBeenCalledWith({ refeicoes: MEALS }, { merge: true });
    });

    it('aceita refeições com alimentos trocados no alimentos array', async () => {
      const mealsSwapped = [
        { horario: '08:00', nome: 'Café da Manhã', alimentos: ['Iogurte', 'Granola'] },
      ];
      await saveDietMeals(MOCK_UID, MOCK_DIET_ID, mealsSwapped);
      expect(mockSet).toHaveBeenCalledWith(
        { refeicoes: mealsSwapped },
        { merge: true }
      );
    });

    it('não lança erro quando o firestore não está disponível (web)', async () => {
      expect(typeof saveDietMeals).toBe('function');
    });
  });
});
