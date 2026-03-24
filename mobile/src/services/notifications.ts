import * as Notifications from 'expo-notifications';

type Meal = {
  horario: string;
  nome: string;
  alimentos: string[];
};

function parseTime(horario: string): { hour: number; minute: number } {
  const [h, m] = horario.split(':').map(Number);
  return { hour: h || 12, minute: m || 0 };
}

export async function scheduleMealNotifications(meals: Meal[]) {
  for (const meal of meals) {
    const { hour, minute } = parseTime(meal.horario);
    const firstFood = meal.alimentos[0] || meal.nome;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🥗 Hora de ${meal.nome}!`,
        body: `Sua dieta sugere: ${firstFood}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

export async function scheduleWaterReminder(remainingGlasses: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💧 Hora de beber água!',
      body: `Já bebeu água hoje? Faltam ${remainingGlasses} copos!`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 14,
      minute: 0,
    },
  });
}

export async function scheduleStreakReminder(currentStreak: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Sua ofensiva está em risco!',
      body: `Sua ofensiva de ${currentStreak} dias está em risco! Abra o app agora.`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
