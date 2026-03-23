import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { useWaterStore } from '../../stores/waterStore';
import { Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

let Haptics: any = null;
if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch (e) {}
}

const CIRCLE_SIZE = 120;
const STROKE_WIDTH = 10;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function WaterTracker() {
  const { glasses, goal, addGlass } = useWaterStore();
  const progress = Math.min(glasses / goal, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const isFull = glasses >= goal;

  async function handleAddGlass() {
    if (isFull) return;
    addGlass();
    if (Haptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.circleContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Track (fundo) */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={colors.lightGray}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progresso */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={isFull ? colors.green : colors.blue}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.circleText}>
            <Text style={styles.glassesNumber}>{glasses}</Text>
            <Text style={styles.glassesGoal}>/{goal}</Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>💧 Hidratação</Text>
          <Text style={styles.subtitle}>
            {isFull 
              ? '🎉 Meta atingida! Parabéns!' 
              : `Faltam ${goal - glasses} copos (250ml)`
            }
          </Text>
          <Pressable 
            style={[styles.addButton, isFull && styles.addButtonDisabled]} 
            onPress={handleAddGlass}
            disabled={isFull}
          >
            <Text style={styles.addButtonText}>
              {isFull ? '✅ Completo' : '💧 +1 Copo'}
            </Text>
          </Pressable>
        </View>
      </View>
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
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  glassesNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.blue,
  },
  glassesGoal: {
    fontSize: 16,
    color: colors.gray,
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.green,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
