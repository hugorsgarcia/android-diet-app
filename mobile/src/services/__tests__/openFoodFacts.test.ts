import { searchFood, getProductByBarcode } from '../openFoodFacts';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

const mockProduct = {
  code: '7891000100103',
  product_name: 'Leite Integral',
  nutriments: {
    'energy-kcal_100g': 64,
    proteins_100g: 3.2,
    carbohydrates_100g: 4.8,
    fat_100g: 3.5,
  },
  image_front_small_url: 'https://images.openfoodfacts.org/test.jpg',
  countries_tags: ['en:brazil'],
};

const mockSearchResponse = {
  count: 1,
  products: [mockProduct],
};

const mockBarcodeResponse = {
  status: 1,
  product: mockProduct,
};

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe('openFoodFacts service', () => {
  describe('searchFood', () => {
    it('deve retornar lista de produtos ao buscar por texto', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const results = await searchFood('leite');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Leite Integral');
      expect(results[0].calories).toBe(64);
      expect(results[0].protein).toBe(3.2);
      expect(results[0].carbs).toBe(4.8);
      expect(results[0].fat).toBe(3.5);
    });

    it('deve incluir User-Agent customizado no header', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      await searchFood('banana');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'DietaAI/1.0 (dietaai.app)',
          }),
        })
      );
    });

    it('deve retornar array vazio quando API retorna 0 resultados', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 0, products: [] }),
      });

      const results = await searchFood('xyzinexistente');
      expect(results).toEqual([]);
    });

    it('deve retornar array vazio quando fetch falha', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const results = await searchFood('banana');
      expect(results).toEqual([]);
    });

    it('deve limitar resultados a 20 itens', async () => {
      const manyProducts = Array.from({ length: 30 }, (_, i) => ({
        ...mockProduct,
        product_name: `Product ${i}`,
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 30, products: manyProducts }),
      });

      const results = await searchFood('test');
      expect(results.length).toBeLessThanOrEqual(20);
    });

    it('deve usar cache quando resultado já existe e não expirou', async () => {
      const cachedData = {
        data: [{ name: 'Cached', calories: 100, protein: 5, carbs: 10, fat: 2, barcode: '' }],
        timestamp: Date.now(),
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData));

      const results = await searchFood('leite');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(results[0].name).toBe('Cached');
    });

    it('deve ignorar cache expirado (>24h) e buscar da API', async () => {
      const expiredCache = {
        data: [{ name: 'Old', calories: 50, protein: 1, carbs: 2, fat: 1, barcode: '' }],
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(expiredCache));
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const results = await searchFood('leite');
      expect(global.fetch).toHaveBeenCalled();
      expect(results[0].name).toBe('Leite Integral');
    });
  });

  describe('getProductByBarcode', () => {
    it('deve retornar produto ao buscar por barcode válido', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBarcodeResponse,
      });

      const product = await getProductByBarcode('7891000100103');

      expect(product).not.toBeNull();
      expect(product!.name).toBe('Leite Integral');
      expect(product!.barcode).toBe('7891000100103');
      expect(product!.calories).toBe(64);
    });

    it('deve retornar null para barcode não encontrado (status 0)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0, product: null }),
      });

      const product = await getProductByBarcode('0000000000000');
      expect(product).toBeNull();
    });

    it('deve retornar null em caso de erro de rede', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Timeout'));

      const product = await getProductByBarcode('7891000100103');
      expect(product).toBeNull();
    });

    it('deve salvar produto no cache após busca bem-sucedida', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBarcodeResponse,
      });

      await getProductByBarcode('7891000100103');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('off_barcode_7891000100103'),
        expect.any(String)
      );
    });

    it('deve retornar do cache se barcode já foi buscado recentemente', async () => {
      const cachedProduct = {
        data: { name: 'Cached Product', calories: 100, protein: 5, carbs: 10, fat: 3, barcode: '123' },
        timestamp: Date.now(),
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedProduct));

      const product = await getProductByBarcode('123');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(product!.name).toBe('Cached Product');
    });

    it('deve lidar com produto sem dados nutricionais', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            code: '111',
            product_name: 'Produto Sem Info',
            nutriments: {},
          },
        }),
      });

      const product = await getProductByBarcode('111');
      expect(product).not.toBeNull();
      expect(product!.calories).toBe(0);
      expect(product!.protein).toBe(0);
    });
  });
});
