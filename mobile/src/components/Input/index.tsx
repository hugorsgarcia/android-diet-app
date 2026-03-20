import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native'
import { colors } from '../../../constants/colors'

interface InputProps extends TextInputProps {
  label: string;
}

export function Input({ label, ...rest }: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#FFFFFF99"
        keyboardAppearance="dark"
        selectionColor={colors.green}
        {...rest}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 16,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white + "15",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.white + "40",
  },
})
