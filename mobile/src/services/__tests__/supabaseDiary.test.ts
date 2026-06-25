// Testa as funções de Diary no supabase.ts

const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpsert = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

// Mock do supabaseClient
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

describe('supabase diary functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadDiary', () => {
    it('deve carregar entries do Supabase para uma data específica', async () => {
      const mockData = {
        entries: [
          { name: 'Banana', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
        ],
        daily_goal: 2000,
      };
      mockSingle.mockResolvedValueOnce({ data: mockData, error: null });

      const { loadDiary } = require('../supabase');
      const result = await loadDiary('test-uid', '2026-03-23');

      expect(result).toEqual({ entries: mockData.entries, dailyGoal: mockData.daily_goal });
    });

    it('deve retornar null se o documento não existir', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const { loadDiary } = require('../supabase');
      const result = await loadDiary('test-uid', '2026-03-23');

      expect(result).toBeNull();
    });
  });

  describe('saveDiary', () => {
    it('deve salvar entries no Supabase com upsert', async () => {
      const entries = [
        { name: 'Frango', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      ];

      const { saveDiary } = require('../supabase');
      await saveDiary('test-uid', '2026-03-23', entries, 2000);

      expect(mockUpsert).toHaveBeenCalledWith(
        { user_id: 'test-uid', date: '2026-03-23', entries, daily_goal: 2000 },
        { onConflict: 'user_id,date' }
      );
    });
  });
});
