import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { colors } from '../../constants/colors';
import { router, useLocalSearchParams } from 'expo-router';
import { useShoppingStore } from '../../src/stores/shoppingStore';

let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Haptics not available
}

export default function Shopping() {
  const { data } = useLocalSearchParams();
  const store = useShoppingStore();
  const { items } = store;
  const { checked, total } = store.getProgress();
  const progressPercent = total > 0 ? Math.round((checked / total) * 100) : 0;

  // Carregar da dieta se recebeu dados por parâmetro
  if (data && items.length === 0) {
    try {
      const dietData = JSON.parse(data as string);
      if (dietData.refeicoes) {
        store.setFromDiet(dietData.refeicoes);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  function handleToggle(id: string) {
    store.toggleItem(id);
    if (Platform.OS !== 'web' && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </Pressable>
          <Text style={styles.title}>🛒 Lista de Compras</Text>
          <Text style={styles.subtitle}>
            Itens da sua dieta personalizada
          </Text>
        </View>

        {/* Progress */}
        {total > 0 && (
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>
              {progressPercent === 100 ? '🎉 Tudo comprado!' : `${checked}/${total} itens`}
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        )}

        {/* Lista de itens */}
        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              Nenhum item na lista.{'\n'}Gere uma dieta para criar a lista de compras.
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.itemRow, item.checked && styles.itemRowChecked]}
              onPress={() => handleToggle(item.id)}
            >
              <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                {item.name}
              </Text>
            </Pressable>
          ))
        )}

        {/* Clear button */}
        {items.length > 0 && (
          <Pressable style={styles.clearButton} onPress={() => store.clearAll()}>
            <Text style={styles.clearButtonText}>🗑️ Limpar Lista</Text>
          </Pressable>
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
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 4,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  itemRow: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  itemRowChecked: {
    backgroundColor: colors.green + '08',
    borderColor: colors.green + '30',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.lightGray,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemName: {
    fontSize: 16,
    color: colors.black,
    flex: 1,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.gray,
  },
  clearButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#EF4444' + '10',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#EF4444',
  },
});
