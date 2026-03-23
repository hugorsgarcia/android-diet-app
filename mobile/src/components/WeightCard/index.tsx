import { View, Text, Pressable, StyleSheet, Alert, TextInput } from 'react-native';
import { colors } from '../../../constants/colors';
import { useWeightStore } from '../../stores/weightStore';
import Svg, { Polyline } from 'react-native-svg';
import { useState } from 'react';

const GRAPH_WIDTH = 200;
const GRAPH_HEIGHT = 60;

export function WeightCard() {
  const { entries, goal, addEntry, setGoal } = useWeightStore();
  const latest = entries.length > 0 ? entries[entries.length - 1] : null;

  function handleAddWeight() {
    Alert.prompt
      ? Alert.prompt(
          'Registrar Peso',
          'Digite seu peso atual (kg):',
          (text) => {
            const value = parseFloat(text);
            if (!isNaN(value) && value > 0 && value < 500) {
              addEntry(value);
            }
          },
          'plain-text',
          latest ? String(latest.value) : '',
          'numeric'
        )
      : showManualInput();
  }

  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  function showManualInput() {
    setShowInput(true);
    setInputValue(latest ? String(latest.value) : '');
  }

  function confirmInput() {
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value > 0 && value < 500) {
      addEntry(value);
      setShowInput(false);
      setInputValue('');
    }
  }

  // Mini gráfico de linha
  function renderMiniGraph() {
    if (entries.length < 2) return null;

    const lastEntries = entries.slice(-10);
    const values = lastEntries.map(e => e.value);
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    const range = max - min || 1;

    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * GRAPH_WIDTH;
      const y = GRAPH_HEIGHT - ((v - min) / range) * GRAPH_HEIGHT;
      return `${x},${y}`;
    }).join(' ');

    return (
      <View style={styles.graphContainer}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          <Polyline
            points={points}
            fill="none"
            stroke={colors.green}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚖️ Peso</Text>
        <Pressable style={styles.addButton} onPress={handleAddWeight}>
          <Text style={styles.addButtonText}>+ Registrar</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Atual</Text>
          <Text style={styles.statValue}>
            {latest ? `${latest.value} kg` : '— kg'}
          </Text>
        </View>
        {goal > 0 && (
          <>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Meta</Text>
              <Text style={[styles.statValue, { color: colors.green }]}>
                {goal} kg
              </Text>
            </View>
          </>
        )}
      </View>

      {renderMiniGraph()}

      {showInput && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            placeholder="Ex: 82.5"
            placeholderTextColor={colors.gray}
          />
          <Pressable style={styles.confirmButton} onPress={confirmInput}>
            <Text style={styles.confirmButtonText}>✓</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={() => setShowInput(false)}>
            <Text style={styles.cancelButtonText}>✕</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
  },
  addButton: {
    backgroundColor: colors.green + '15',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.black,
  },
  arrow: {
    fontSize: 20,
    color: colors.gray,
    marginHorizontal: 16,
  },
  graphContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  confirmButton: {
    backgroundColor: colors.green,
    borderRadius: 8,
    padding: 10,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 10,
  },
  cancelButtonText: {
    color: colors.gray,
    fontSize: 18,
    fontWeight: 'bold', 
  },
});
