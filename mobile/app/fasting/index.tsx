import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors } from '../../constants/colors';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useFastingStore, FastingPlan } from '../../src/stores/fastingStore';
import { getCurrentUser, loadFasting, saveFasting } from '../../src/services/firebase';
import Svg, { Circle } from 'react-native-svg';

const PLANS: { key: FastingPlan; label: string; desc: string }[] = [
  { key: '16:8', label: '16:8', desc: '16h jejum / 8h alimentação' },
  { key: '14:10', label: '14:10', desc: '14h jejum / 10h alimentação' },
  { key: '12:12', label: '12:12', desc: '12h jejum / 12h alimentação' },
  { key: '5:2', label: '5:2', desc: '5 dias normal / 2 dias restritos (24h)' },
];

const CIRCLE_SIZE = 220;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTimer(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Fasting() {
  const store = useFastingStore();
  const { isFasting, currentPlan, startTime, endTime, history } = store;
  const [remaining, setRemaining] = useState(store.getRemainingMs());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Carregar do Firestore ao montar
  useEffect(() => {
    async function load() {
      const user = getCurrentUser();
      if (!user) return;
      const data = await loadFasting(user.uid);
      if (data) store.setFromFirestore(data);
    }
    load();
  }, []);

  // Timer ativo durante jejum
  useEffect(() => {
    if (isFasting) {
      intervalRef.current = setInterval(() => {
        const ms = store.getRemainingMs();
        setRemaining(ms);
        if (ms <= 0) {
          store.stopFasting();
          syncToFirestore();
        }
      }, 1000);
    } else {
      setRemaining(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isFasting]);

  async function syncToFirestore() {
    const user = getCurrentUser();
    if (!user) return;
    const state = useFastingStore.getState();
    await saveFasting(user.uid, {
      isFasting: state.isFasting,
      currentPlan: state.currentPlan,
      startTime: state.startTime,
      endTime: state.endTime,
      history: state.history,
    });
  }

  function handleStart(plan: FastingPlan) {
    store.startFasting(plan);
    syncToFirestore();
  }

  function handleStop() {
    store.stopFasting();
    syncToFirestore();
  }

  // Progresso do timer (0 a 1)
  const totalMs = startTime && endTime
    ? new Date(endTime).getTime() - new Date(startTime).getTime()
    : 1;
  const progress = isFasting ? Math.max(0, 1 - remaining / totalMs) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </Pressable>
          <Text style={styles.title}>⏱️ Jejum Intermitente</Text>
          <Text style={styles.subtitle}>
            {isFasting ? `Plano ${currentPlan} em andamento` : 'Escolha um plano para começar'}
          </Text>
        </View>

        {/* Timer circular */}
        <View style={styles.timerContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Background circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={colors.lightGray}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            {/* Progress circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={isFasting ? colors.green : colors.lightGray}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerText}>
              {isFasting ? formatTimer(remaining) : '00:00:00'}
            </Text>
            <Text style={styles.timerLabel}>
              {isFasting
                ? remaining <= 0
                  ? '🎉 Jejum completo!'
                  : 'restante'
                : 'parado'}
            </Text>
          </View>
        </View>

        {/* Botão parar (se em jejum) */}
        {isFasting && (
          <Pressable style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>⏹️ Encerrar Jejum</Text>
          </Pressable>
        )}

        {/* Planos (se não em jejum) */}
        {!isFasting && (
          <>
            <Text style={styles.sectionTitle}>Escolha seu plano</Text>
            {PLANS.map((plan) => (
              <Pressable
                key={plan.key}
                style={styles.planCard}
                onPress={() => handleStart(plan.key)}
              >
                <View style={styles.planInfo}>
                  <Text style={styles.planLabel}>{plan.label}</Text>
                  <Text style={styles.planDesc}>{plan.desc}</Text>
                </View>
                <Text style={styles.planArrow}>▶</Text>
              </Pressable>
            ))}
          </>
        )}

        {/* Histórico */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Histórico</Text>
            {history.slice(-5).reverse().map((entry, i) => (
              <View key={i} style={styles.historyItem}>
                <Text style={styles.historyIcon}>
                  {entry.completed ? '✅' : '⏸️'}
                </Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyPlan}>{entry.plan}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(entry.startTime).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <Text style={styles.historyStatus}>
                  {entry.completed ? 'Completo' : 'Interrompido'}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    fontSize: 16,
    color: colors.blue,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.green,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray,
    marginTop: 4,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.black,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  stopButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 12,
    marginTop: 8,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.green,
  },
  planDesc: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 4,
  },
  planArrow: {
    fontSize: 18,
    color: colors.green,
  },
  historyItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  historyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyPlan: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  historyDate: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  historyStatus: {
    fontSize: 13,
    color: colors.gray,
    fontWeight: '500',
  },
});
