import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert } from 'react-native'
import { colors } from '../../constants/colors'
import { useState } from 'react'
import { router } from 'expo-router'
import { useDataStore } from '../../store/data'

export default function Step() {
  const [page, setPage] = useState<1 | 2>(1)

  // Página 1
  const [name, setName] = useState("")
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [age, setAge] = useState("")

  // Página 2
  const [gender, setGender] = useState("")
  const [level, setLevel] = useState("")
  const [objective, setObjective] = useState("")

  const setPageOne = useDataStore((state) => state.setPageOne)
  const setPageTwo = useDataStore((state) => state.setPageTwo)

  function handleNextPage() {
    if (page === 1) {
      if (!name || !weight || !height || !age) {
        Alert.alert("Atenção", "Preencha todos os campos antes de continuar")
        return
      }

      setPageOne({
        name,
        weight,
        height,
        age
      })

      setPage(2)
    } else {
      if (!gender || !level || !objective) {
        Alert.alert("Atenção", "Preencha todos os campos antes de continuar")
        return
      }

      setPageTwo({
        gender,
        level,
        objective
      })

      router.push("/create")
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Vamos começar</Text>
        <Text style={styles.subtitle}>
          {page === 1 
            ? "Preencha seus dados pessoais"
            : "Escolha suas preferências"
          }
        </Text>

        {page === 1 ? (
          <>
            <Text style={styles.label}>Nome:</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Digite seu nome"
              placeholderTextColor={colors.white + "60"}
            />

            <Text style={styles.label}>Peso (kg):</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="Ex: 75"
              placeholderTextColor={colors.white + "60"}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Altura (cm):</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="Ex: 175"
              placeholderTextColor={colors.white + "60"}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Idade:</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Ex: 25"
              placeholderTextColor={colors.white + "60"}
              keyboardType="numeric"
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Sexo:</Text>
            <View style={styles.optionsContainer}>
              <Pressable
                style={[
                  styles.optionButton,
                  gender === "masculino" && styles.optionButtonSelected
                ]}
                onPress={() => setGender("masculino")}
              >
                <Text style={[
                  styles.optionText,
                  gender === "masculino" && styles.optionTextSelected
                ]}>Masculino</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  gender === "feminino" && styles.optionButtonSelected
                ]}
                onPress={() => setGender("feminino")}
              >
                <Text style={[
                  styles.optionText,
                  gender === "feminino" && styles.optionTextSelected
                ]}>Feminino</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Nível de atividade física:</Text>
            <View style={styles.optionsContainer}>
              <Pressable
                style={[
                  styles.optionButton,
                  level === "sedentário" && styles.optionButtonSelected
                ]}
                onPress={() => setLevel("sedentário")}
              >
                <Text style={[
                  styles.optionText,
                  level === "sedentário" && styles.optionTextSelected
                ]}>Sedentário</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  level === "levemente ativo" && styles.optionButtonSelected
                ]}
                onPress={() => setLevel("levemente ativo")}
              >
                <Text style={[
                  styles.optionText,
                  level === "levemente ativo" && styles.optionTextSelected
                ]}>Levemente Ativo</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  level === "moderadamente ativo" && styles.optionButtonSelected
                ]}
                onPress={() => setLevel("moderadamente ativo")}
              >
                <Text style={[
                  styles.optionText,
                  level === "moderadamente ativo" && styles.optionTextSelected
                ]}>Moderadamente Ativo</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  level === "muito ativo" && styles.optionButtonSelected
                ]}
                onPress={() => setLevel("muito ativo")}
              >
                <Text style={[
                  styles.optionText,
                  level === "muito ativo" && styles.optionTextSelected
                ]}>Muito Ativo</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Objetivo:</Text>
            <View style={styles.optionsContainer}>
              <Pressable
                style={[
                  styles.optionButton,
                  objective === "emagrecer" && styles.optionButtonSelected
                ]}
                onPress={() => setObjective("emagrecer")}
              >
                <Text style={[
                  styles.optionText,
                  objective === "emagrecer" && styles.optionTextSelected
                ]}>Emagrecer</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  objective === "hipertrofia" && styles.optionButtonSelected
                ]}
                onPress={() => setObjective("hipertrofia")}
              >
                <Text style={[
                  styles.optionText,
                  objective === "hipertrofia" && styles.optionTextSelected
                ]}>Hipertrofia</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  objective === "definição" && styles.optionButtonSelected
                ]}
                onPress={() => setObjective("definição")}
              >
                <Text style={[
                  styles.optionText,
                  objective === "definição" && styles.optionTextSelected
                ]}>Definição</Text>
              </Pressable>
            </View>
          </>
        )}

        <Pressable style={styles.button} onPress={handleNextPage}>
          <Text style={styles.buttonText}>
            {page === 1 ? "Avançar" : "Gerar Dieta"}
          </Text>
        </Pressable>

        {page === 2 && (
          <Pressable style={styles.backButton} onPress={() => setPage(1)}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.green,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white + "20",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.white + "30",
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: colors.white + "20",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.white + "30",
  },
  optionButtonSelected: {
    backgroundColor: colors.blue + "30",
    borderColor: colors.blue,
  },
  optionText: {
    color: colors.white + "80",
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.white,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 32,
    marginBottom: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 16,
    marginBottom: 32,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
})
