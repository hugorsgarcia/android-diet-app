// Testa as funções de DietSync (meal checkins + saveDietMeals) no supabase.ts

const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpsert = jest.fn();
const mockUpdate = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('../supabaseClient', () => {
  const chainable = {
    from: (...args: any[]) => {
      mockFrom(...args);
      return chainable;
    },
    select: (...args: any[]) => {
      mockSelect(...args);
      return chainable;
    },
    eq: (...args: any[]) => {
      mockEq(...args);
      return chainable;
    },
    single: () => mockSingle(),
    upsert: (...args: any[]) => {
      mockUpsert(...args);
      return Promise.resolve({ data: null, error: null });
    },
    update: (...args: any[]) => {
      mockUpdate(...args);
      return chainable;
    },
  };

  return {
    supabase: {
      ...chainable,
      auth: {
        signInAnonymously: jest.fn(),
        getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
        getUser: jest.fn(),
      },
      functions: {
        invoke: jest.fn(),
      },
    },
  };
});

describe('supabase diet sync functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveMealCheckins', () => {
    it('deve salvar checkins via upsert', async () => {
      const { saveMealCheckins } = require('../supabase');
      const checkins = { 0: true, 1: false };

      await saveMealCheckins('test-uid', 'diet-123', checkins);

      expect(mockUpsert).toHaveBeenCalledWith(
        { user_id: 'test-uid', diet_id: 'diet-123', checkins },
        { onConflict: 'user_id,diet_id' }
      );
    });
  });

  describe('saveDietMeals', () => {
    it('deve atualizar diet_data.refeicoes quando dieta existe', async () => {
      const mockDietData = { refeicoes: [], nome: 'Test' };
      mockSingle.mockResolvedValueOnce({ data: { diet_data: mockDietData }, error: null });

      const { saveDietMeals } = require('../supabase');
      const meals = [{ horario: '08:00', nome: 'Café', alimentos: ['Pão'] }];

      await saveDietMeals('test-uid', 'diet-123', meals);

      expect(mockUpdate).toHaveBeenCalledWith({
        diet_data: { ...mockDietData, refeicoes: meals },
      });
    });
  });
});
