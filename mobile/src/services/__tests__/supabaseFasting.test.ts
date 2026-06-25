// Testa as funções de Fasting no supabase.ts

const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpsert = jest.fn();

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

describe('supabase fasting functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadFasting', () => {
    it('deve carregar sessão de jejum do Supabase', async () => {
      const mockData = {
        is_fasting: true,
        current_plan: '16:8',
        start_time: '2026-03-23T08:00:00Z',
        end_time: '2026-03-24T00:00:00Z',
        history: [],
      };
      mockSingle.mockResolvedValueOnce({ data: mockData, error: null });

      const { loadFasting } = require('../supabase');
      const result = await loadFasting('test-uid');

      expect(result).toEqual({
        isFasting: true,
        currentPlan: '16:8',
        startTime: '2026-03-23T08:00:00Z',
        endTime: '2026-03-24T00:00:00Z',
        history: [],
      });
    });

    it('deve retornar null se não existir', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const { loadFasting } = require('../supabase');
      const result = await loadFasting('test-uid');

      expect(result).toBeNull();
    });
  });

  describe('saveFasting', () => {
    it('deve salvar sessão de jejum via upsert', async () => {
      const { saveFasting } = require('../supabase');
      const fastingData = {
        isFasting: true,
        currentPlan: '16:8',
        startTime: '2026-03-23T08:00:00Z',
        endTime: '2026-03-24T00:00:00Z',
        history: [],
      };

      await saveFasting('test-uid', fastingData);

      expect(mockUpsert).toHaveBeenCalledWith(
        {
          user_id: 'test-uid',
          is_fasting: true,
          current_plan: '16:8',
          start_time: '2026-03-23T08:00:00Z',
          end_time: '2026-03-24T00:00:00Z',
          history: [],
        },
        { onConflict: 'user_id' }
      );
    });
  });
});
