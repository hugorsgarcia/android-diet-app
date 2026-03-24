import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput, Platform } from 'react-native';
import { colors } from '../../constants/colors';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getProductByBarcode, FoodProduct } from '../../src/services/openFoodFacts';
import { useDiaryStore, MealType } from '../../src/stores/diaryStore';

let CameraView: any = null;
let useCameraPermissions: any = null;

if (Platform.OS !== 'web') {
  try {
    const cam = require('expo-camera');
    CameraView = cam.CameraView;
    useCameraPermissions = cam.useCameraPermissions;
  } catch (e) {
    console.warn('expo-camera not available:', e);
  }
}

export default function Scanner() {
  const { mealType } = useLocalSearchParams<{ mealType: string }>();
  const addEntry = useDiaryStore((state) => state.addEntry);

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState('100');

  // Permissão da câmera (hook condicional: só roda em plataformas nativas)
  const cameraHook = useCameraPermissions ? useCameraPermissions() : [{ granted: false }, () => Promise.resolve()];
  const [permission, requestPermission] = cameraHook;

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError('');

    const result = await getProductByBarcode(data);

    if (result) {
      setProduct(result);
    } else {
      setError(`Produto não encontrado para o código: ${data}`);
    }

    setLoading(false);
  }

  function handleAddToDiary() {
    if (!product) return;

    const qty = parseFloat(quantity) || 100;
    const ratio = qty / 100;

    addEntry({
      name: product.name,
      calories: Math.round(product.calories * ratio),
      protein: Math.round(product.protein * ratio * 10) / 10,
      carbs: Math.round(product.carbs * ratio * 10) / 10,
      fat: Math.round(product.fat * ratio * 10) / 10,
      quantity: qty,
      unit: 'g',
      mealType: (mealType as MealType) || 'cafe',
      source: 'barcode',
      barcode: product.barcode,
    });

    router.back();
  }

  function handleScanAgain() {
    setScanned(false);
    setProduct(null);
    setError('');
    setQuantity('100');
  }

  // Fallback para web ou câmera indisponível
  if (!CameraView) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </Pressable>
          <Text style={styles.title}>📷 Scanner</Text>
        </View>
        <View style={styles.noCameraContainer}>
          <Text style={styles.noCameraText}>
            📷 Scanner de código de barras não disponível nesta plataforma.
          </Text>
          <Text style={styles.noCameraSubtext}>
            Use a busca de alimentos para adicionar itens ao diário.
          </Text>
          <Pressable
            style={styles.searchFallbackButton}
            onPress={() => router.replace({ pathname: '/food-search' as any, params: { mealType } })}
          >
            <Text style={styles.searchFallbackText}>🔍 Ir para Busca</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </Pressable>
          <Text style={styles.title}>📷 Scanner</Text>
        </View>
        <View style={styles.noCameraContainer}>
          <Text style={styles.noCameraText}>
            Precisamos de permissão para acessar a câmera.
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Permitir Acesso</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>📷 Escanear Código de Barras</Text>
      </View>

      {/* Câmera ou resultado */}
      {!product && !error ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanText}>
              Aponte a câmera para o código de barras
            </Text>
          </View>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.loadingText}>Buscando produto...</Text>
            </View>
          )}
        </View>
      ) : error ? (
        <View style={styles.resultContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.scanAgainButton} onPress={handleScanAgain}>
            <Text style={styles.scanAgainText}>Escanear Novamente</Text>
          </Pressable>
        </View>
      ) : product ? (
        <View style={styles.resultContainer}>
          <View style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>

            <View style={styles.nutrientsRow}>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{product.calories}</Text>
                <Text style={styles.nutrientLabel}>kcal</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={[styles.nutrientValue, { color: '#EF4444' }]}>{product.protein}g</Text>
                <Text style={styles.nutrientLabel}>Proteína</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={[styles.nutrientValue, { color: '#F59E0B' }]}>{product.carbs}g</Text>
                <Text style={styles.nutrientLabel}>Carbs</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={[styles.nutrientValue, { color: '#3B82F6' }]}>{product.fat}g</Text>
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

            <Pressable style={styles.scanAgainButton} onPress={handleScanAgain}>
              <Text style={styles.scanAgainText}>Escanear Outro</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Atribuição Open Food Facts */}
      <Text style={styles.attribution}>
        Dados nutricionais do Open Food Facts (openfoodfacts.org)
      </Text>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.green,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: colors.green,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanText: {
    color: colors.white,
    fontSize: 14,
    marginTop: 16,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
    marginTop: 12,
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
    textAlign: 'center',
    marginBottom: 20,
  },
  nutrientsRow: {
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
  scanAgainButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.blue + '15',
    borderRadius: 12,
  },
  scanAgainText: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  noCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noCameraText: {
    fontSize: 18,
    color: colors.black,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  noCameraSubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  searchFallbackButton: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  searchFallbackText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionButton: {
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  attribution: {
    fontSize: 11,
    color: colors.gray,
    textAlign: 'center',
    padding: 8,
    fontStyle: 'italic',
  },
});
