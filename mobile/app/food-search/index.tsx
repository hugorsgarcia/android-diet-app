import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Modal, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { searchFood, FoodProduct } from '../../src/services/openFoodFacts';
import { useDiaryStore, MealType } from '../../src/stores/diaryStore';

export default function FoodSearch() {
  const { mealType } = useLocalSearchParams<{ mealType: string }>();
  const addEntry = useDiaryStore((state) => state.addEntry);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [quantity, setQuantity] = useState('100');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchFood(text.trim());
      setResults(data);
      setLoading(false);
    }, 500);
  }, []);

  function handleSelectProduct(product: FoodProduct) {
    setSelectedProduct(product);
    setQuantity('100');
  }

  function handleAddToDiary() {
    if (!selectedProduct) return;

    const qty = parseFloat(quantity) || 100;
    const ratio = qty / 100;

    addEntry({
      name: selectedProduct.name,
      calories: Math.round(selectedProduct.calories * ratio),
      protein: Math.round(selectedProduct.protein * ratio * 10) / 10,
      carbs: Math.round(selectedProduct.carbs * ratio * 10) / 10,
      fat: Math.round(selectedProduct.fat * ratio * 10) / 10,
      quantity: qty,
      unit: 'g',
      mealType: (mealType as MealType) || 'cafe',
      source: 'search',
      barcode: selectedProduct.barcode,
    });

    setSelectedProduct(null);
    router.back();
  }

  function renderItem({ item }: { item: FoodProduct }) {
    return (
      <Pressable style={styles.resultItem} onPress={() => handleSelectProduct(item)}>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.resultMacros}>
            {item.calories} kcal/100g • P:{item.protein}g C:{item.carbs}g G:{item.fat}g
          </Text>
        </View>
        {item.country && (
          <Text style={styles.resultCountry}>{item.country}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>🔍 Buscar Alimento</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ex: banana, arroz, frango..."
          placeholderTextColor={colors.gray}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          returnKeyType="search"
        />
      </View>

      {/* Loading */}
      {loading && (
        <ActivityIndicator size="small" color={colors.green} style={styles.loader} />
      )}

      {/* Resultados */}
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.barcode}_${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
          ) : null
        }
      />

      {/* Atribuição Open Food Facts */}
      <Text style={styles.attribution}>
        Dados nutricionais do Open Food Facts (openfoodfacts.org)
      </Text>

      {/* Modal de detalhe do produto */}
      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <Text style={styles.modalProductName}>{selectedProduct.name}</Text>

                <View style={styles.modalNutrients}>
                  <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientValue}>{selectedProduct.calories}</Text>
                    <Text style={styles.nutrientLabel}>kcal</Text>
                  </View>
                  <View style={styles.nutrientItem}>
                    <Text style={[styles.nutrientValue, { color: '#EF4444' }]}>{selectedProduct.protein}g</Text>
                    <Text style={styles.nutrientLabel}>Proteína</Text>
                  </View>
                  <View style={styles.nutrientItem}>
                    <Text style={[styles.nutrientValue, { color: '#F59E0B' }]}>{selectedProduct.carbs}g</Text>
                    <Text style={styles.nutrientLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutrientItem}>
                    <Text style={[styles.nutrientValue, { color: '#3B82F6' }]}>{selectedProduct.fat}g</Text>
                    <Text style={styles.nutrientLabel}>Gordura</Text>
                  </View>
                </View>

                <Text style={styles.perLabel}>por 100g</Text>

                <View style={styles.quantityRow}>
                  <Text style={styles.quantityLabel}>Quantidade (g):</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>

                <Pressable style={styles.addButton} onPress={handleAddToDiary}>
                  <Text style={styles.addButtonText}>Adicionar ao Diário</Text>
                </Pressable>

                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setSelectedProduct(null)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 8,
  },
  backButton: {
    fontSize: 16,
    color: colors.blue,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.green,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  loader: {
    marginVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  resultItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  resultMacros: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  resultCountry: {
    fontSize: 12,
    color: colors.gray,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray,
    fontSize: 15,
    marginTop: 40,
  },
  attribution: {
    fontSize: 11,
    color: colors.gray,
    textAlign: 'center',
    padding: 8,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalProductName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalNutrients: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.green,
  },
  nutrientLabel: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  perLabel: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  quantityInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.lightGray,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.gray,
    fontSize: 16,
  },
});
