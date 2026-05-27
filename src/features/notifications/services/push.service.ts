import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { upsertPushToken, deactivatePushToken } from '../api/notifications.api';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function requestPushPermissions(): Promise<PushPermissionStatus> {
  if (!Device.isDevice) return 'denied';

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return 'granted';

  const { status } = await Notifications.requestPermissionsAsync();
  return status as PushPermissionStatus;
}

export async function registerPushToken(): Promise<string | null> {
  try {
    const status = await requestPushPermissions();
    if (status !== 'granted') return null;

    // Android: create notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'SecuriClick',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#208AEF',
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('security', {
        name: 'Alertes sécurité',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#ef4444',
        sound: 'default',
      });
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '858bf27d-7dbe-4355-bb8c-13fc80bb2b24',
    });
    const platform =
      Platform.OS === 'ios'
        ? 'ios'
        : Platform.OS === 'android'
          ? 'android'
          : 'web';

    await upsertPushToken(token.data, platform);
    return token.data;
  } catch {
    return null;
  }
}

export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    await deactivatePushToken(token.data);
  } catch {
    // Token may already be invalid
  }
}

export function addForegroundNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Badge not supported on all platforms
  }
}
