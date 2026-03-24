import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://world.openfoodfacts.org';
const USER_AGENT = 'DietaAI/1.0 (dietaai.app)';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h em ms
const MAX_RESULTS = 20;

export type FoodProduct = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode: string;
  imageUrl?: string;
  country?: string;
};

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const cached: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) return null;

    return cached.data;
  } catch {
    return null;
  }
}

async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Cache write failure is non-critical
  }
}

function parseProduct(product: any): FoodProduct {
  const nutriments = product.nutriments || {};
  return {
    name: product.product_name || 'Produto sem nome',
    calories: nutriments['energy-kcal_100g'] || 0,
    protein: nutriments.proteins_100g || 0,
    carbs: nutriments.carbohydrates_100g || 0,
    fat: nutriments.fat_100g || 0,
    barcode: product.code || '',
    imageUrl: product.image_front_small_url,
    country: product.countries_tags?.[0]?.replace('en:', ''),
  };
}

export async function searchFood(query: string): Promise<FoodProduct[]> {
  const cacheKey = `off_search_${query.toLowerCase().trim()}`;

  try {
    const cached = await getFromCache<FoodProduct[]>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${MAX_RESULTS}&fields=code,product_name,nutriments,image_front_small_url,countries_tags`;

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const products = (data.products || [])
      .slice(0, MAX_RESULTS)
      .map(parseProduct);

    await saveToCache(cacheKey, products);
    return products;
  } catch {
    return [];
  }
}

export async function getProductByBarcode(barcode: string): Promise<FoodProduct | null> {
  const cacheKey = `off_barcode_${barcode}`;

  try {
    const cached = await getFromCache<FoodProduct>(cacheKey);
    if (cached) return cached;

    const url = `${BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,nutriments,image_front_small_url,countries_tags`;

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.status || !data.product) return null;

    const product = parseProduct(data.product);
    product.barcode = barcode;

    await saveToCache(cacheKey, product);
    return product;
  } catch {
    return null;
  }
}
