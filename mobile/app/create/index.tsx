import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { colors } from '../../constants/colors'
import { useDataStore } from '../../store/data'
import { useEffect } from 'react'
import { router } from 'expo-router'
import axios from 'axios'

interface ResponseData {
  nome: string;
  sexo: string;
  idade: string;
  altura: string;
  peso: string;
  objetivo: string;
  refeicoes: Array<{
    horario: string;
    nome: string;
    alimentos: string[];
  }>;
  suplementos: string[];
}

export default function Create() {
  const user = useDataStore((state) => state.user)

  useEffect(() => {
    async function generateDiet() {
      try {
        // Configure a URL da API de acordo com o ambiente
        // Para Android Emulator use: http://10.0.2.2:3333
        // Para iOS Simulator ou dispositivo físico, use o IP da sua máquina (ex: http://192.168.1.10:3333)
        const apiUrl = "http://10.0.2.2:3333/create"

        const response = await axios.post<ResponseData>(apiUrl, {
          name: user.name,
          weight: user.weight,
          height: user.height,
          age: user.age,
          gender: user.gender,
          level: user.level,
          objective: user.objective
        })

        if (response.data) {
          // Navegar para a tela de dieta com os dados
          router.push({
            pathname: "/diet" as any,
            params: { data: JSON.stringify(response.data) }
          })
        }
      } catch (error) {
        console.error("Erro ao gerar dieta:", error)
        
        Alert.alert(
          "Erro",
          "Não foi possível gerar sua dieta. Verifique sua conexão e tente novamente.",
          [
            {
              text: "Tentar Novamente",
              onPress: () => generateDiet()
            },
            {
              text: "Voltar",
              onPress: () => router.back()
            }
          ]
        )
      }
    }

    generateDiet()
  }, [user])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gerando sua dieta...</Text>
      <Text style={styles.subtitle}>
        A IA está analisando seus dados e criando uma dieta personalizada
      </Text>
      <ActivityIndicator size="large" color={colors.green} style={styles.loader} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.green,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 32,
  },
  loader: {
    marginTop: 24,
  },
})
