import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform } from 'react-native'
import { colors } from '../../constants/colors'
import { useState, useEffect, useCallback, useRef } from 'react'
import { router } from 'expo-router'
import { useDataStore } from '../../store/data'
import { Input } from '../../src/components/Input'
import { Option } from '../../src/components/Option'

let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let TestIds: any = null;

if (Platform.OS !== 'web') {
  const ads = require('react-native-google-mobile-ads');
  RewardedAd = ads.RewardedAd;
  RewardedAdEventType = ads.RewardedAdEventType;
  TestIds = ads.TestIds;
}

// Use TestIds durante desenvolvimento. Substitua pelo ID real na produção.
const REWARDED_AD_UNIT_ID = Platform.OS !== 'web' ? TestIds?.REWARDED : '';

export default function Step() {
  const [page, setPage] = useState<1 | 2>(1)
  const [adLoaded, setAdLoaded] = useState(false)

  const [name, setName] = useState("")
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [age, setAge] = useState("")

  const [gender, setGender] = useState("")
  const [level, setLevel] = useState("")
  const [objective, setObjective] = useState("")
  const [dietType, setDietType] = useState("")

  const setPageOne = useDataStore((state) => state.setPageOne)
  const setPageTwo = useDataStore((state) => state.setPageTwo)

  // Audit Fix #3: rewarded criado dentro do componente via useRef
  // para evitar instâncias globais inrecuperáveis após erros.
  const rewardedRef = useRef<any>(null);

  // Carregar anúncio Rewarded
  useEffect(() => {
    if (Platform.OS === 'web' || !RewardedAd) {
      setAdLoaded(true);
      return;
    }

    // Cria o anúncio dentro do ciclo de vida do componente
    const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      keywords: ['nutrition', 'diet', 'health', 'fitness'],
    });
    rewardedRef.current = rewarded;

    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setAdLoaded(true)
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward: any) => {
        console.log('Usuário ganhou recompensa:', reward);
        // Navegar para criar dieta após assistir o anúncio
        router.push("/create");
      }
    );

    // Carregar o anúncio
    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      rewardedRef.current = null;
    };
  }, []);

  const showRewardedAd = useCallback(() => {
    const rewarded = rewardedRef.current;
    if (adLoaded && rewarded) {
      rewarded.show();
    } else {
      // Se o anúncio não carregou, deixa prosseguir mesmo assim
      console.log("Ad não carregado ou não suportado, prosseguindo sem anúncio.");
      router.push("/create");
    }
  }, [adLoaded]);

  function handleNextPage() {
    if (page === 1) {
      if (!name || !weight || !height || !age) {
        Alert.alert("Atenção", "Preencha todos os campos antes de continuar")
        return
      }
      setPageOne({ name, weight, height, age })
      setPage(2)
    } else {
      if (!gender || !level || !objective) {
        Alert.alert("Atenção", "Preencha todos os campos antes de continuar")
        return
      }
      setPageTwo({ gender, level, objective, dietType: dietType || 'padrao' })
      
      // Mostrar anúncio Rewarded antes de gerar dieta
      showRewardedAd()
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Vamos começar</Text>
        <Text style={styles.subtitle}>
          {page === 1 ? "Preencha seus dados pessoais" : "Escolha suas preferências"}
        </Text>

        {page === 1 ? (
          <>
            <Input label="Nome:" value={name} onChangeText={setName} placeholder="Digite seu nome" />
            <Input label="Peso (kg):" value={weight} onChangeText={setWeight} placeholder="Ex: 75" keyboardType="numeric" />
            <Input label="Altura (cm):" value={height} onChangeText={setHeight} placeholder="Ex: 175" keyboardType="numeric" />
            <Input label="Idade:" value={age} onChangeText={setAge} placeholder="Ex: 25" keyboardType="numeric" />
          </>
        ) : (
          <>
            <Text style={styles.label}>Sexo:</Text>
            <View style={styles.optionsContainer}>
              <Option label="Masculino" selected={gender === "masculino"} onPress={() => setGender("masculino")} />
              <Option label="Feminino" selected={gender === "feminino"} onPress={() => setGender("feminino")} />
            </View>

            <Text style={styles.label}>Nível de atividade física:</Text>
            <View style={styles.optionsContainer}>
              <Option label="Sedentário" selected={level === "sedentário"} onPress={() => setLevel("sedentário")} />
              <Option label="Levemente Ativo" selected={level === "levemente ativo"} onPress={() => setLevel("levemente ativo")} />
              <Option label="Moderadamente Ativo" selected={level === "moderadamente ativo"} onPress={() => setLevel("moderadamente ativo")} />
              <Option label="Muito Ativo" selected={level === "muito ativo"} onPress={() => setLevel("muito ativo")} />
            </View>

            <Text style={styles.label}>Objetivo:</Text>
            <View style={styles.optionsContainer}>
              <Option label="Emagrecer" selected={objective === "emagrecer"} onPress={() => setObjective("emagrecer")} />
              <Option label="Hipertrofia" selected={objective === "hipertrofia"} onPress={() => setObjective("hipertrofia")} />
              <Option label="Definição" selected={objective === "definição"} onPress={() => setObjective("definição")} />
            </View>

            <Text style={styles.label}>Tipo de Dieta:</Text>
            <View style={styles.optionsContainer}>
              <Option label="Padrão" selected={dietType === "" || dietType === "padrao"} onPress={() => setDietType("padrao")} />
              <Option label="Low Carb" selected={dietType === "low carb"} onPress={() => setDietType("low carb")} />
              <Option label="Keto" selected={dietType === "keto"} onPress={() => setDietType("keto")} />
              <Option label="Vegetariana" selected={dietType === "vegetariana"} onPress={() => setDietType("vegetariana")} />
              <Option label="Vegana" selected={dietType === "vegana"} onPress={() => setDietType("vegana")} />
              <Option label="Mediterrânea" selected={dietType === "mediterrânea"} onPress={() => setDietType("mediterrânea")} />
            </View>
          </>
        )}

        <Pressable style={styles.button} onPress={handleNextPage}>
          <Text style={styles.buttonText}>
            {page === 1 ? "Avançar" : "🎬 Assistir Anúncio e Gerar Dieta"}
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
    color: colors.gray,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: colors.black,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  optionsContainer: {
    gap: 12,
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
    color: colors.gray,
    fontSize: 16,
    textAlign: 'center',
  },
})
