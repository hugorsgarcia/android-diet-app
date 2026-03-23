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
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.lightGray,
  },
  optionButtonSelected: {
    backgroundColor: colors.green + "10",
    borderColor: colors.green,
    borderWidth: 2,
  },
  optionText: {
    color: colors.gray,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 1,
  },
  optionTextSelected: {
    color: colors.green,
    opacity: 1,
  },
})
