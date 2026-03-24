import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, Modal } from 'react-native';
import { colors } from '../../constants/colors';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useDiaryStore, MealType } from '../../src/stores/diaryStore';
import { CalorieArc } from '../../src/components/CalorieArc';
import { MacroBar } from '../../src/components/MacroBar';
import { getCurrentUser, loadDiary, saveDiary } from '../../src/services/firebase';

const MEAL_SECTIONS: { key: MealType; label: string; icon: string }[] = [
  { key: 'cafe', label: 'Café da Manhã', icon: '☕' },
  { key: 'almoco', label: 'Almoço', icon: '🍛' },
  { key: 'lanche', label: 'Lanche', icon: '🥪' },
  { key: 'janta', label: 'Janta', icon: '🍽️' },
];

function getWeekDates(): { date: string; dayLabel: string; isToday: boolean }[] {
  const today = new Date();
  const dates = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    dates.push({ date: dateStr, dayLabel, isToday: i === 0 });
  }
  return dates;
}

export default function Diary() {
  const store = useDiaryStore();
  const { entries, selectedDate, dailyCalorieGoal } = store;
  const totals = store.getTotals();
  const weekDates = getWeekDates();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('cafe');

  // Carregar diário do Firestore quando a data muda
  useEffect(() => {
    async function load() {
      const user = getCurrentUser();
      if (!user) return;

      const data = await loadDiary(user.uid, selectedDate);
      if (data) {
        store.setFromFirestore(data.entries || [], data.dailyGoal);
      } else {
        store.setFromFirestore([]);
      }
    }
    load();
  }, [selectedDate]);

  // Salvar no Firestore quando entries mudam
  useEffect(() => {
    async function save() {
      const user = getCurrentUser();
      if (!user || entries.length === 0) return;
      await saveDiary(user.uid, selectedDate, entries, dailyCalorieGoal);
    }
    save();
  }, [entries.length]);

  function handleAddFood(mealType: MealType) {
    setActiveMealType(mealType);
    setShowAddModal(true);
  }

  function goToSearch() {
    setShowAddModal(false);
    router.push({ pathname: '/food-search' as any, params: { mealType: activeMealType } });
  }

  function goToScanner() {
    setShowAddModal(false);
    router.push({ pathname: '/scanner' as any, params: { mealType: activeMealType } });
  }

  // Macro goals estimados (proporção padrão: 30% proteína, 40% carbs, 30% gordura)
  const proteinGoal = Math.round((dailyCalorieGoal * 0.3) / 4);
  const carbsGoal = Math.round((dailyCalorieGoal * 0.4) / 4);
  const fatGoal = Math.round((dailyCalorieGoal * 0.3) / 9);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </Pressable>
          <Text style={styles.title}>📋 Diário Alimentar</Text>
        </View>

        {/* Calendário horizontal */}
        <FlatList
          horizontal
          data={weekDates}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarContainer}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.calendarDay,
                item.date === selectedDate && styles.calendarDaySelected,
              ]}
              onPress={() => store.setDate(item.date)}
            >
              <Text
                style={[
                  styles.calendarDayLabel,
                  item.date === selectedDate && styles.calendarDayLabelSelected,
                ]}
              >
                {item.dayLabel}
              </Text>
              <Text
                style={[
                  styles.calendarDayNumber,
                  item.date === selectedDate && styles.calendarDayNumberSelected,
                ]}
              >
                {item.date.split('-')[2]}
              </Text>
              {item.isToday && <View style={styles.todayDot} />}
            </Pressable>
          )}
        />

        {/* Arco de calorias */}
        <View style={styles.arcCard}>
          <CalorieArc consumed={totals.calories} goal={dailyCalorieGoal} />
        </View>

        {/* Macros */}
        <View style={styles.macroCard}>
          <Text style={styles.macroTitle}>Macronutrientes</Text>
          <MacroBar label="Proteína" current={totals.protein} goal={proteinGoal} color="#EF4444" />
          <MacroBar label="Carboidratos" current={totals.carbs} goal={carbsGoal} color="#F59E0B" />
          <MacroBar label="Gordura" current={totals.fat} goal={fatGoal} color="#3B82F6" />
        </View>

        {/* Seções de refeição */}
        {MEAL_SECTIONS.map((section) => {
          const mealEntries = store.getEntriesByMeal(section.key);
          return (
            <View key={section.key} style={styles.mealSection}>
              <View style={styles.mealSectionHeader}>
                <Text style={styles.mealSectionTitle}>
                  {section.icon} {section.label}
                </Text>
                <Text style={styles.mealSectionCalories}>
                  {mealEntries.reduce((sum, e) => sum + e.calories, 0)} kcal
                </Text>
              </View>

              {mealEntries.map((entry) => (
                <View key={entry.id} style={styles.foodItem}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{entry.name}</Text>
                    <Text style={styles.foodDetails}>
                      {entry.quantity}{entry.unit} • {entry.calories} kcal
                    </Text>
                  </View>
                  <Pressable onPress={() => store.removeEntry(entry.id)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </Pressable>
                </View>
              ))}

              <Pressable
                style={styles.addFoodButton}
                onPress={() => handleAddFood(section.key)}
              >
                <Text style={styles.addFoodButtonText}>+ Adicionar</Text>
              </Pressable>
            </View>
          );
        })}

        {/* Atribuição Open Food Facts */}
        <Text style={styles.attribution}>
          Dados nutricionais do Open Food Facts (openfoodfacts.org)
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de adicionar alimento */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Alimento</Text>

            <Pressable style={styles.modalOption} onPress={goToSearch}>
              <Text style={styles.modalOptionIcon}>🔍</Text>
              <View>
                <Text style={styles.modalOptionTitle}>Buscar Alimento</Text>
                <Text style={styles.modalOptionDesc}>Pesquisar por nome</Text>
              </View>
            </Pressable>

            <Pressable style={styles.modalOption} onPress={goToScanner}>
              <Text style={styles.modalOptionIcon}>📷</Text>
              <View>
                <Text style={styles.modalOptionTitle}>Escanear Código</Text>
                <Text style={styles.modalOptionDesc}>Código de barras do produto</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.modalCancel}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: colors.blue,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.green,
  },
  calendarContainer: {
    paddingVertical: 8,
    gap: 8,
  },
  calendarDay: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    minWidth: 52,
  },
  calendarDaySelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  calendarDayLabel: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  calendarDayLabelSelected: {
    color: colors.white,
  },
  calendarDayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
    marginTop: 4,
  },
  calendarDayNumberSelected: {
    color: colors.white,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.orange,
    marginTop: 4,
  },
  arcCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  macroCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 12,
  },
  mealSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
  },
  mealSectionCalories: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '600',
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  foodDetails: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
  },
  removeButton: {
    fontSize: 18,
    color: colors.gray,
    padding: 8,
  },
  addFoodButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: colors.green + '10',
  },
  addFoodButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.green,
  },
  attribution: {
    fontSize: 11,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 24,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginBottom: 12,
    gap: 16,
  },
  modalOptionIcon: {
    fontSize: 28,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
  },
  modalOptionDesc: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
  },
  modalCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.gray,
  },
});
