import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, current, goal, color, unit = 'g' }: MacroBarProps) {
  const progress = Math.min(current / Math.max(goal, 1), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          {Math.round(current)}{unit} / {Math.round(goal)}{unit}
        </Text>
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  values: {
    fontSize: 13,
    color: colors.gray,
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
