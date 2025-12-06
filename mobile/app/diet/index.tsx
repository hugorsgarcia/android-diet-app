import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { colors } from '../../constants/colors'
import { useLocalSearchParams, router } from 'expo-router'
import { useDataStore } from '../../store/data'

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

export default function Diet() {
  const { data } = useLocalSearchParams()
  const resetData = useDataStore((state) => state.resetData)
  
  const dietData: ResponseData = data ? JSON.parse(data as string) : null

  if (!dietData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erro ao carregar a dieta</Text>
      </View>
    )
  }

  function handleNewDiet() {
    resetData()
    router.replace("/")
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Sua Dieta Personalizada</Text>
          <Text style={styles.subtitle}>
            Dieta criada para {dietData.nome}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Objetivo:</Text>
            <Text style={styles.infoValue}>{dietData.objetivo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Peso:</Text>
            <Text style={styles.infoValue}>{dietData.peso} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Altura:</Text>
            <Text style={styles.infoValue}>{dietData.altura} cm</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Idade:</Text>
            <Text style={styles.infoValue}>{dietData.idade} anos</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Refeições</Text>
        {dietData.refeicoes.map((refeicao, index) => (
          <View key={index} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTime}>{refeicao.horario}</Text>
              <Text style={styles.mealName}>{refeicao.nome}</Text>
            </View>
            <View style={styles.foodList}>
              {refeicao.alimentos.map((alimento, foodIndex) => (
                <View key={foodIndex} style={styles.foodItem}>
                  <Text style={styles.foodBullet}>•</Text>
                  <Text style={styles.foodText}>{alimento}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {dietData.suplementos && dietData.suplementos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Suplementos Recomendados</Text>
            <View style={styles.supplementCard}>
              {dietData.suplementos.map((suplemento, index) => (
                <View key={index} style={styles.supplementItem}>
                  <Text style={styles.supplementBullet}>✓</Text>
                  <Text style={styles.supplementText}>{suplemento}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Pressable style={styles.button} onPress={handleNewDiet}>
          <Text style={styles.buttonText}>Gerar Nova Dieta</Text>
        </Pressable>

        <View style={{ height: 32 }} />
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
  },
  header: {
    paddingTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.green,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white + "90",
  },
  infoCard: {
    backgroundColor: colors.white + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.white + "20",
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.white + "70",
  },
  infoValue: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.green,
    marginTop: 8,
    marginBottom: 16,
  },
  mealCard: {
    backgroundColor: colors.blue + "20",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.blue + "40",
  },
  mealHeader: {
    marginBottom: 12,
  },
  mealTime: {
    fontSize: 14,
    color: colors.white + "70",
    marginBottom: 4,
  },
  mealName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  foodList: {
    gap: 8,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  foodBullet: {
    fontSize: 16,
    color: colors.green,
    marginRight: 8,
    marginTop: 2,
  },
  foodText: {
    fontSize: 16,
    color: colors.white,
    flex: 1,
  },
  supplementCard: {
    backgroundColor: colors.green + "20",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.green + "40",
  },
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  supplementBullet: {
    fontSize: 16,
    color: colors.green,
    marginRight: 8,
    fontWeight: 'bold',
  },
  supplementText: {
    fontSize: 16,
    color: colors.white,
    flex: 1,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: colors.white,
    fontSize: 18,
    textAlign: 'center',
  },
})
