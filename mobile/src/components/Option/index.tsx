import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors } from '../../../constants/colors'

interface OptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Option({ label, selected, onPress }: OptionProps) {
  return (
    <Pressable
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  optionButton: {
    backgroundColor: colors.white + "10",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.white + "30",
  },
  optionButtonSelected: {
    backgroundColor: colors.blue + "40",
    borderColor: colors.blue,
    borderWidth: 2,
  },
  optionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
  optionTextSelected: {
    color: colors.white,
    opacity: 1,
  },
})
