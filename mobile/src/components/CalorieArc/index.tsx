import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../../constants/colors';

interface CalorieArcProps {
  consumed: number;
  goal: number;
}

const SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CENTER = SIZE / 2;

function describeArc(startAngle: number, endAngle: number): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = CENTER + RADIUS * Math.cos(startRad);
  const y1 = CENTER + RADIUS * Math.sin(startRad);
  const x2 = CENTER + RADIUS * Math.cos(endRad);
  const y2 = CENTER + RADIUS * Math.sin(endRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export function CalorieArc({ consumed, goal }: CalorieArcProps) {
  const progress = Math.min(consumed / Math.max(goal, 1), 1);
  const startAngle = 135;
  const totalSweep = 270;
  const endAngle = startAngle + totalSweep * progress;
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Track de fundo */}
        <Path
          d={describeArc(startAngle, startAngle + totalSweep)}
          stroke={colors.lightGray}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
        />
        {/* Progresso */}
        {progress > 0 && (
          <Path
            d={describeArc(startAngle, endAngle)}
            stroke={isOver ? colors.orange : colors.green}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
          />
        )}
      </Svg>
      <View style={styles.centerText}>
        <Text style={[styles.calories, isOver && { color: colors.orange }]}>
          {consumed}
        </Text>
        <Text style={styles.separator}>/ {goal} kcal</Text>
        <Text style={styles.remaining}>
          {isOver ? `${consumed - goal} kcal acima` : `Restam ${remaining}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  calories: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.green,
  },
  separator: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  remaining: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
});
