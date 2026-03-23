import { View, Text, Image, StyleSheet, Pressable, ScrollView } from 'react-native'
import { colors } from '../constants/colors'
import { router } from 'expo-router'
import { useDataStore } from '../store/data'
import { useEffect } from 'react'
import { WaterTracker } from '../src/components/WaterTracker'
import { StreakCard } from '../src/components/StreakCard'
import { WeightCard } from '../src/components/WeightCard'
import { useWaterStore } from '../src/stores/waterStore'
import { useStreakStore } from '../src/stores/streakStore'
import { useWeightStore } from '../src/stores/weightStore'
import {
  getCurrentUser,
  loadWater,
  saveWater,
  loadStreak,
  saveStreak,
  loadWeightHistory,
  loadWeightGoal,
  addWeightEntry as firebaseAddWeight,
  saveWeightGoal as firebaseSaveGoal,
} from '../src/services/firebase'

export default function Index() {
  const resetData = useDataStore((state) => state.resetData)
  const waterStore = useWaterStore()
  const streakStore = useStreakStore()
  const weightStore = useWeightStore()

  // Carregar dados do Firestore ao montar
  useEffect(() => {
    async function loadData() {
      const user = getCurrentUser();
      if (!user) return;
      const uid = user.uid;

      // Water
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const waterData = await loadWater(uid, dateKey);
      if (waterData) {
        waterStore.setFromFirestore(waterData);
      }

      // Streak
      const streakData = await loadStreak(uid);
      if (streakData) {
        streakStore.setFromFirestore(streakData);
      }

      // Weight
      const weightEntries = await loadWeightHistory(uid);
      const weightGoal = await loadWeightGoal(uid);
      if (weightEntries.length > 0 || weightGoal) {
        weightStore.setFromFirestore(
          weightEntries.map((e: any) => ({ value: e.value, date: e.date })),
          weightGoal || 0
        );
      }
    }
    loadData();
  }, []);

  // Salvar água no Firestore quando muda
  useEffect(() => {
    async function sync() {
      const user = getCurrentUser();
      if (!user || waterStore.glasses === 0) return;
      await saveWater(user.uid, waterStore.date, {
        glasses: waterStore.glasses,
        goal: waterStore.goal,
      });

      // Registrar atividade no Streak quando bebe água
      streakStore.recordActivity();
      await saveStreak(user.uid, {
        current: useStreakStore.getState().current,
        best: useStreakStore.getState().best,
        lastActiveDate: useStreakStore.getState().lastActiveDate,
      });
    }
    sync();
  }, [waterStore.glasses]);

  // Salvar peso no Firestore quando muda
  useEffect(() => {
    async function sync() {
      const user = getCurrentUser();
      if (!user || weightStore.entries.length === 0) return;
      const latest = weightStore.entries[weightStore.entries.length - 1];
      await firebaseAddWeight(user.uid, latest.value);
    }
    // Apenas sincroniza se entries mudou (não no primeiro load)
  }, [weightStore.entries.length]);

  function handleStart() {
    resetData()
    router.push("/step")
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>
          Dieta<Text style={{ color: colors.black }}>.AI</Text>
        </Text>
        <Text style={styles.text}>
          Seu companheiro diário de saúde
        </Text>
      </View>

      {/* Dashboard Cards */}
      <StreakCard />
      <WaterTracker />
      <WeightCard />

      {/* Ações principais */}
      <Pressable style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>🍽️ Gerar Nova Dieta</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.green,
    marginTop: 8,
  },
  text: {
    fontSize: 15,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.green,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
})