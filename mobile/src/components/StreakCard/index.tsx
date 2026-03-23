import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { useStreakStore } from '../../stores/streakStore';

export function StreakCard() {
  const { current, best } = useStreakStore();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.fireEmoji}>🔥</Text>
        <View style={styles.info}>
          <Text style={styles.title}>Ofensiva</Text>
          <Text style={styles.counter}>
            {current} {current === 1 ? 'dia' : 'dias'} 
          </Text>
        </View>
        <View style={styles.bestContainer}>
          <Text style={styles.bestLabel}>Recorde</Text>
          <Text style={styles.bestValue}>{best} 🏆</Text>
        </View>
      </View>
      {current === 0 && (
        <Text style={styles.hint}>
          Registre uma refeição ou beba água para iniciar sua ofensiva!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireEmoji: {
    fontSize: 40,
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '600',
  },
  counter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.orange,
  },
  bestContainer: {
    alignItems: 'center',
  },
  bestLabel: {
    fontSize: 12,
    color: colors.gray,
  },
  bestValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.orange,
  },
  hint: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
