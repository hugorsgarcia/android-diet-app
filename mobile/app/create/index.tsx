import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { colors } from '../../constants/colors'
import { useDataStore } from '../../store/data'
import { useEffect } from 'react'
import { router } from 'expo-router'
import { callGenerateDiet } from '../../src/services/firebase'

export default function Create() {
  const user = useDataStore((state) => state.user)

  useEffect(() => {
    async function generateDiet() {
      try {
        console.log("Enviando dados para Cloud Function:", {
          name: user.name,
          weight: user.weight,
          height: user.height,
          age: user.age,
          gender: user.gender,
          level: user.level,
          objective: user.objective
        })

        // Chama a Cloud Function via Firebase SDK (substitui o Axios)
        const result = await callGenerateDiet({
          name: user.name,
          weight: user.weight,
          height: user.height,
          age: user.age,
          gender: user.gender,
          level: user.level,
          objective: user.objective
        });

        console.log("Resposta da Cloud Function:", result)

        if (result && result.data) {
          router.push({
            pathname: "/diet" as any,
            params: { data: JSON.stringify(result.data) }
          })
        }
      } catch (error: any) {
        console.error("Erro ao gerar dieta:", error)
        
        let errorMessage = "Não foi possível gerar sua dieta. Verifique sua conexão e tente novamente."
        
        if (error.code === 'functions/resource-exhausted') {
          errorMessage = "Limite de requisições excedido. Aguarde alguns minutos e tente novamente."
        } else if (error.code === 'functions/unauthenticated') {
          errorMessage = "Erro de autenticação. Reinicie o aplicativo."
        } else if (error.code === 'functions/invalid-argument') {
          errorMessage = error.message || "Dados inválidos. Verifique os campos e tente novamente."
        } else if (error.message?.includes('Network')) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
        }
        
        Alert.alert(
          "Erro",
          errorMessage,
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
