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

import { loadFasting, saveFasting } from '../firebase';

describe('Firebase Fasting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load fasting data from Firestore', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        isFasting: true,
        currentPlan: '16:8',
        startTime: '2026-03-24T20:00:00Z',
        endTime: '2026-03-25T12:00:00Z',
      }),
    });
    const data = await loadFasting('uid123');
    expect(data).not.toBeNull();
    expect(data?.isFasting).toBe(true);
  });

  it('should return null when no fasting data exists', async () => {
    mockGet.mockResolvedValueOnce({ exists: false, data: () => null });
    const data = await loadFasting('unknown-uid');
    expect(data).toBeNull();
  });

  it('should save fasting data to Firestore', async () => {
    await expect(
      saveFasting('uid123', {
        isFasting: true,
        currentPlan: '16:8',
        startTime: '2026-03-24T20:00:00Z',
        endTime: '2026-03-25T12:00:00Z',
        history: [],
      })
    ).resolves.not.toThrow();
  });
});
