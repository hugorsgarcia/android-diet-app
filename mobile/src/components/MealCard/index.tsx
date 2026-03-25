import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { colors } from '../../../constants/colors'

interface Meal {
  horario: string;
  nome: string;
  alimentos: string[];
}

interface MealCardProps {
  meal: Meal;
  index: number;
  checkinValue: boolean | undefined;
  isSwapping: boolean;
  swappingThisIndex: boolean;
  onCheckin: (index: number, ate: boolean) => void;
  onSwap: (index: number) => void;
  onUndo: (index: number) => void; // PROD-04
}

export function MealCard({
  meal,
  index,
  checkinValue,
  isSwapping,
  swappingThisIndex,
  onCheckin,
  onSwap,
  onUndo,
}: MealCardProps) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View>
          <Text style={styles.mealTime}>{meal.horario}</Text>
          <Text style={styles.mealName}>{meal.nome}</Text>
        </View>
        {checkinValue !== undefined && (
          <Text style={styles.checkinBadge}>
            {checkinValue ? '✅' : '❌'}
          </Text>
        )}
      </View>

      <View style={styles.foodList}>
        {meal.alimentos.map((alimento, foodIndex) => (
          <View key={foodIndex} style={styles.foodItem}>
            <Text style={styles.foodBullet}>•</Text>
            <Text style={styles.foodText}>{alimento}</Text>
          </View>
        ))}
      </View>

      <View style={styles.mealActions}>
        {checkinValue === undefined ? (
          <>
            <Pressable
              style={[styles.checkinButton, styles.checkinAte]}
              onPress={() => onCheckin(index, true)}
            >
              <Text style={styles.checkinButtonText}>✅ Comi</Text>
            </Pressable>
            <Pressable
              style={[styles.checkinButton, styles.checkinSkipped]}
              onPress={() => onCheckin(index, false)}
            >
              <Text style={styles.checkinSkippedText}>❌ Furei</Text>
            </Pressable>
          </>
        ) : (
          // PROD-04: botão de desfazer
          <Pressable
            style={[styles.checkinButton, styles.undoButton]}
            onPress={() => onUndo(index)}
          >
            <Text style={styles.undoButtonText}>↩ Desfazer</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.swapButton}
          onPress={() => onSwap(index)}
          disabled={isSwapping}
        >
          {swappingThisIndex ? (
            <ActivityIndicator size="small" color={colors.blue} />
          ) : (
            <Text style={styles.swapButtonText}>🔄 Trocar</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
  undoButton: {
    backgroundColor: colors.gray + '15',
  },
  undoButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray,
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
})
