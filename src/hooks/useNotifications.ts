import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import type { Transaction } from '../types';

const BACKGROUND_TASK = 'UPDATE_BADGE_COUNT';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

TaskManager.defineTask(BACKGROUND_TASK, async () => {
  const pendentes = await getPendingCount();
  await Notifications.setBadgeCountAsync(pendentes);
});

async function getPendingCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}

export function useNotifications() {
  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    return true;
  };

  // ponytail: O(n) schedule per tx — dedup via same txId, add per-tx check if chatty
  const scheduleForTransaction = async (tx: Transaction) => {
    if (tx.status !== 'PENDING') return;
    const txDate = new Date(tx.date + 'T09:00:00-03:00');
    if (txDate.getTime() <= Date.now()) return;

    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: tx.type === 'INCOME' ? 'Valor a receber' : 'Conta a pagar',
        body: `${tx.title} — R$ ${tx.amount.toFixed(2).replace('.', ',')}`,
        data: { txId: tx.id, type: 'due' },
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: txDate,
      },
    });
  };

  const cancelForTransaction = async (txId: string) => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(
      (s: Notifications.NotificationRequest) => s.content.data && (s.content.data as any).txId === txId
    );
    for (const s of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(s.identifier);
    }
  };

  const updateBadge = async () => {
    const count = await getPendingCount();
    await Notifications.setBadgeCountAsync(count);
  };

  return { scheduleForTransaction, cancelForTransaction, updateBadge, requestPermission };
}
