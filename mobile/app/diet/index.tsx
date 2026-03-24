import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, ActivityIndicator } from 'react-native'
import { colors } from '../../constants/colors'
import { useLocalSearchParams, router } from 'expo-router'
import { useState } from 'react'
import { getCurrentUser } from '../../src/services/firebase'
import { callSwapMealFood } from '../../src/services/firebase'
import { useStreakStore } from '../../src/stores/streakStore'
import { saveStreak } from '../../src/services/firebase'
import { saveMealCheckins } from '../../src/services/firebase'
import { saveDietMeals } from '../../src/services/firebase'
import { useDiaryStore } from '../../src/stores/diaryStore'
import { useShoppingStore } from '../../src/stores/shoppingStore'
import { mapDietToDiaryEntries } from '../../src/services/dietToDiary'

let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

if (Platform.OS !== 'web') {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
}

interface ResponseData {
  nome: string;
  sexo: string;
  idade: number | string;
  altura: string;
  peso: string;
  objetivo: string;
  calorias_diarias?: number;
  macronutrientes?: {
    proteinas: string;
    carboidratos: string;
    gorduras: string;
  };
  refeicoes: Array<{
    horario: string;
    nome: string;
    alimentos: string[];
  }>;
  suplementos: Array<string | {
    nome: string;
    dosagem: string;
    quando_tomar: string;
  }>;
}

export default function Diet() {
  const { data, dietId: dietIdParam } = useLocalSearchParams()
  const streakStore = useStreakStore()
  const dietId = (dietIdParam as string) || ''

  const dietData: ResponseData = data ? JSON.parse(data as string) : null
  const [meals, setMeals] = useState<ResponseData['refeicoes']>(dietData?.refeicoes || [])
  const [checkins, setCheckins] = useState<Record<number, boolean>>({})
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null)
  // BUG-06: trava global — impede trocas paralelas
  const [isSwapping, setIsSwapping] = useState(false)

  if (!dietData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erro ao carregar a dieta</Text>
      </View>
    )
  }

  // Progresso do check-in
  const totalMeals = meals.length;
  const checkedMeals = Object.keys(checkins).length;
  const progressPercent = totalMeals > 0 ? Math.round((checkedMeals / totalMeals) * 100) : 0;

  function handleCheckin(index: number, ate: boolean) {
    const newCheckins = { ...checkins, [index]: ate };
    setCheckins(newCheckins);

    // Registrar atividade no streak
    streakStore.recordActivity();
    const user = getCurrentUser();
    if (user) {
      saveStreak(user.uid, {
        current: useStreakStore.getState().current,
        best: useStreakStore.getState().best,
        lastActiveDate: useStreakStore.getState().lastActiveDate,
      });
      // BUG-04: persistir check-ins no Firestore
      if (dietId) {
        saveMealCheckins(user.uid, dietId, newCheckins);
      }
    }
  }

  async function handleSwap(mealIndex: number) {
    const meal = meals[mealIndex];
    Alert.alert(
      '🔄 Trocar Alimentos',
      `Qual o motivo da troca dos alimentos de "${meal.nome}"?`,
      [
        { text: 'Não tenho em casa', onPress: () => doSwap(mealIndex, 'Não tenho esses alimentos em casa') },
        { text: 'Não gosto', onPress: () => doSwap(mealIndex, 'Não gosto desses alimentos') },
        { text: 'Alergia', onPress: () => doSwap(mealIndex, 'Tenho alergia a algum desses alimentos') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }

  async function doSwap(mealIndex: number, reason: string) {
    const meal = meals[mealIndex];
    setSwappingIndex(mealIndex);
    setIsSwapping(true); // BUG-06: bloqueia todos os botões de troca

    try {
      const result = await callSwapMealFood({
        mealName: meal.nome,
        currentFoods: meal.alimentos,
        reason,
        dietContext: `Objetivo: ${dietData.objetivo}, Calorias: ${dietData.calorias_diarias}, Macros: ${JSON.stringify(dietData.macronutrientes)}`,
      });

      // Atualizar a refeição localmente
      const updatedMeals = meals.map((m, i) =>
        i === mealIndex ? { ...m, alimentos: result.newAlimentos } : m
      );
      setMeals(updatedMeals);

      // BUG-05: persistir refeições atualizadas no Firestore
      const user = getCurrentUser();
      if (user && dietId) {
        await saveDietMeals(user.uid, dietId, updatedMeals);
      }
    } catch (error) {
      console.error('Erro ao trocar alimentos:', error);
      Alert.alert('Erro', 'Não foi possível trocar os alimentos. Tente novamente.');
    } finally {
      setSwappingIndex(null);
      setIsSwapping(false); // BUG-06: libera o bloqueio
    }
  }

  function handleHome() {
    router.dismissAll()
    router.replace("/")
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Sua Dieta Personalizada</Text>
          <Text style={styles.subtitle}>
            Dieta criada para {dietData.nome}
          </Text>
        </View>

        {/* Progress Bar do Check-in */}
        {checkedMeals > 0 && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>
              {progressPercent === 100 ? '🎉 Parabéns!' : '📊 Progresso do Dia'}
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Você seguiu {progressPercent}% da dieta hoje ({checkedMeals}/{totalMeals} refeições)
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Objetivo:</Text>
            <Text style={styles.infoValue}>{dietData.objetivo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Peso:</Text>
            <Text style={styles.infoValue}>{dietData.peso} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Altura:</Text>
            <Text style={styles.infoValue}>{dietData.altura} cm</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Idade:</Text>
            <Text style={styles.infoValue}>{dietData.idade} anos</Text>
          </View>
          {dietData.calorias_diarias && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Calorias Diárias:</Text>
              <Text style={styles.infoValue}>{dietData.calorias_diarias} kcal</Text>
            </View>
          )}
        </View>

        {dietData.macronutrientes && (
          <View style={styles.macroCard}>
            <Text style={styles.macroTitle}>Macronutrientes</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Proteínas</Text>
                <Text style={styles.macroValue}>{dietData.macronutrientes.proteinas}</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Carboidratos</Text>
                <Text style={styles.macroValue}>{dietData.macronutrientes.carboidratos}</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Gorduras</Text>
                <Text style={styles.macroValue}>{dietData.macronutrientes.gorduras}</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Refeições</Text>
        {meals.map((refeicao, index) => (
          <View key={index} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View>
                <Text style={styles.mealTime}>{refeicao.horario}</Text>
                <Text style={styles.mealName}>{refeicao.nome}</Text>
              </View>
              {/* Check-in status badge */}
              {checkins[index] !== undefined && (
                <Text style={styles.checkinBadge}>
                  {checkins[index] ? '✅' : '❌'}
                </Text>
              )}
            </View>

            <View style={styles.foodList}>
              {refeicao.alimentos.map((alimento, foodIndex) => (
                <View key={foodIndex} style={styles.foodItem}>
                  <Text style={styles.foodBullet}>•</Text>
                  <Text style={styles.foodText}>{alimento}</Text>
                </View>
              ))}
            </View>

            {/* Ações da refeição */}
            <View style={styles.mealActions}>
              {checkins[index] === undefined ? (
                <>
                  <Pressable
                    style={[styles.checkinButton, styles.checkinAte]}
                    onPress={() => handleCheckin(index, true)}
                  >
                    <Text style={styles.checkinButtonText}>✅ Comi</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.checkinButton, styles.checkinSkipped]}
                    onPress={() => handleCheckin(index, false)}
                  >
                    <Text style={styles.checkinSkippedText}>❌ Furei</Text>
                  </Pressable>
                </>
              ) : null}

              {/* Botão de trocar alimento */}
              <Pressable
                style={styles.swapButton}
                onPress={() => handleSwap(index)}
                disabled={isSwapping}  // BUG-06: desabilita TODOS enquanto qualquer troca está em andamento
              >
                {swappingIndex === index ? (
                  <ActivityIndicator size="small" color={colors.blue} />
                ) : (
                  <Text style={styles.swapButtonText}>🔄 Trocar</Text>
                )}
              </Pressable>
            </View>
          </View>
        ))}

        {dietData.suplementos && dietData.suplementos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Suplementos Recomendados</Text>
            <View style={styles.supplementCard}>
              {dietData.suplementos.map((suplemento, index) => {
                const isString = typeof suplemento === 'string';
                const nome = isString ? suplemento : suplemento.nome;
                const detalhes = !isString && suplemento.dosagem 
                  ? `${suplemento.dosagem} - ${suplemento.quando_tomar}`
                  : null;

                return (
                  <View key={index} style={styles.supplementItem}>
                    <Text style={styles.supplementBullet}>✓</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.supplementText}>{nome}</Text>
                      {detalhes && (
                        <Text style={styles.supplementDetails}>{detalhes}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* FEAT-04: Auto-preencher diário com esta dieta */}
        <Pressable
          style={styles.autofillButton}
          onPress={() => {
            const entries = mapDietToDiaryEntries({
              ...dietData,
              calorias_diarias: dietData.calorias_diarias || 2000,
            });
            const diaryStore = useDiaryStore.getState();
            for (const entry of entries) {
              diaryStore.addEntry(entry);
            }
            if (dietData.calorias_diarias) {
              diaryStore.setDailyCalorieGoal(dietData.calorias_diarias);
            }
            Alert.alert('✅ Diário preenchido', `${entries.length} alimentos adicionados ao diário de hoje.`);
          }}
        >
          <Text style={styles.autofillButtonText}>📋 Preencher Diário Automaticamente</Text>
        </Pressable>

        {/* FEAT-08: Lista de Compras */}
        <Pressable
          style={styles.shoppingLinkButton}
          onPress={() => {
            useShoppingStore.getState().setFromDiet(meals);
            router.push('/shopping' as any);
          }}
        >
          <Text style={styles.shoppingLinkButtonText}>🛒 Gerar Lista de Compras</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={handleHome}>
          <Text style={styles.buttonText}>Voltar para o Início</Text>
        </Pressable>

        <View style={{ height: 16 }} />

        {/* Banner Ad fixo na tela de leitura */}
        {Platform.OS !== 'web' && BannerAd && TestIds && BannerAdSize && (
          <View style={styles.adContainer}>
            <BannerAd
              unitId={TestIds.ADAPTIVE_BANNER}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            />
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.green,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
  },
  // Progress card
  progressCard: {
    backgroundColor: colors.green + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.green + '30',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.green,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: colors.gray,
  },
  // Cards
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.gray,
  },
  infoValue: {
    fontSize: 16,
    color: colors.black,
    fontWeight: '600',
  },
  macroCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  macroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.orange,
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 18,
    color: colors.orange,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.green,
    marginTop: 8,
    marginBottom: 16,
  },
  // Meal cards
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTime: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
  },
  checkinBadge: {
    fontSize: 28,
  },
  foodList: {
    gap: 8,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  foodBullet: {
    fontSize: 16,
    color: colors.green,
    marginRight: 8,
    marginTop: 2,
  },
  foodText: {
    fontSize: 16,
    color: colors.black,
    flex: 1,
  },
  // Meal actions
  mealActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 12,
  },
  checkinButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkinAte: {
    backgroundColor: colors.green + '15',
  },
  checkinSkipped: {
    backgroundColor: '#EF444415',
  },
  checkinButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.green,
  },
  checkinSkippedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  swapButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.blue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.blue,
  },
  supplementCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  supplementBullet: {
    fontSize: 16,
    color: colors.green,
    marginRight: 8,
    fontWeight: 'bold',
  },
  supplementText: {
    fontSize: 16,
    color: colors.black,
    fontWeight: '600',
  },
  supplementDetails: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: colors.black,
    fontSize: 18,
    textAlign: 'center',
  },
  adContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  autofillButton: {
    backgroundColor: colors.green,
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 16,
  },
  autofillButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  shoppingLinkButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 12,
  },
  shoppingLinkButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})
