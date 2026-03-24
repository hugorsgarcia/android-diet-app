// Testa as novas funções de Diary no firebase.ts

const mockGet = jest.fn();
const mockSet = jest.fn();

const mockDocRef = {
  get: mockGet,
  set: mockSet,
};

const mockCollectionRef = {
  doc: jest.fn(() => mockDocRef),
};

const mockUserDocRef = {
  collection: jest.fn(() => mockCollectionRef),
};

const mockUsersCollectionRef = {
  doc: jest.fn(() => mockUserDocRef),
};

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('@react-native-firebase/firestore', () => {
  const firestoreFn = () => ({
    collection: jest.fn(() => mockUsersCollectionRef),
  });
  return { default: firestoreFn, __esModule: true };
});

jest.mock('@react-native-firebase/auth', () => {
  const authFn = () => ({
    currentUser: { uid: 'test-uid' },
    signInAnonymously: jest.fn(),
    onAuthStateChanged: jest.fn(),
  });
  return { default: authFn, __esModule: true };
});

jest.mock('@react-native-firebase/functions', () => {
  const fnFn = () => ({
    httpsCallable: jest.fn(),
  });
  return { default: fnFn, __esModule: true };
});

describe('firebase diary functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadDiary', () => {
    it('deve carregar entries do Firestore para uma data específica', async () => {
      const mockData = {
        entries: [
          { name: 'Banana', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
        ],
        dailyGoal: 2000,
      };
      mockGet.mockResolvedValueOnce({ exists: true, data: () => mockData });

      const { loadDiary } = require('../firebase');
      const result = await loadDiary('test-uid', '2026-03-23');

      expect(result).toEqual(mockData);
    });

    it('deve retornar null se o documento não existir', async () => {
      mockGet.mockResolvedValueOnce({ exists: false });

      const { loadDiary } = require('../firebase');
      const result = await loadDiary('test-uid', '2026-03-23');

      expect(result).toBeNull();
    });
  });

  describe('saveDiary', () => {
    it('deve salvar entries no Firestore com merge', async () => {
      mockSet.mockResolvedValueOnce(undefined);

      const entries = [
        { name: 'Frango', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      ];

      const { saveDiary } = require('../firebase');
      await saveDiary('test-uid', '2026-03-23', entries, 2000);

      expect(mockSet).toHaveBeenCalledWith(
        { entries, dailyGoal: 2000 },
        { merge: true }
      );
    });
  });
});
