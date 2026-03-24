jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: 'daily', TIME_INTERVAL: 'timeInterval', DATE: 'date' },
}));

import * as Notifications from 'expo-notifications';
import {
  scheduleMealNotifications,
  scheduleWaterReminder,
  scheduleStreakReminder,
  cancelAllNotifications,
} from '../notifications';

beforeEach(() => jest.clearAllMocks());

describe('Notification Service', () => {
  it('should schedule one notification per meal', async () => {
    await scheduleMealNotifications([
      { horario: '07:00', nome: 'Café', alimentos: ['Ovo'] },
      { horario: '12:30', nome: 'Almoço', alimentos: ['Frango'] },
    ]);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });

  it('should include food name in notification body', async () => {
    await scheduleMealNotifications([
      { horario: '12:30', nome: 'Almoço', alimentos: ['Frango grelhado'] },
    ]);
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.content.body).toContain('Frango grelhado');
  });

  it('should schedule water reminder with remaining glasses', async () => {
    await scheduleWaterReminder(4);
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.content.body).toContain('4');
  });

  it('should schedule streak warning', async () => {
    await scheduleStreakReminder(7);
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.content.body).toContain('7');
  });

  it('should cancel all scheduled notifications', async () => {
    await cancelAllNotifications();
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });
});
