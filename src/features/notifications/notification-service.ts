import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { arrayUnion, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { firebaseDb } from '@/shared/services/firebase';

// Show notifications as banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for permission and store this device's Expo push token so Cloud
 * Functions can notify the user. Quietly does nothing on simulators, when
 * permission is refused, or when the EAS project id isn't configured.
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  if (!Device.isDevice || !firebaseDb) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Bookings and messages',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const status = existing.granted ? existing.status : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('Push notifications are off: add extra.eas.projectId to app.json (run `eas init`).');
    return;
  }
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await setDoc(
    doc(firebaseDb, 'push_tokens', userId),
    { tokens: arrayUnion(token), updated_at: serverTimestamp() },
    { merge: true },
  );
}

/** Where a tapped notification should take the user. */
function routeFor(data: Record<string, unknown> | undefined): Href | null {
  const bookingId = typeof data?.bookingId === 'string' ? data.bookingId : null;
  if (bookingId) return (data?.chat ? `/chat/${bookingId}` : `/bookings/${bookingId}`) as Href;
  return null;
}

/** Register the signed-in user's device and open the right screen when a notification is tapped. */
export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    registerForPushNotifications(userId).catch((error) => console.warn('Push registration failed:', error));
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    // A tap that launched the app from closed.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const target = routeFor(response?.notification.request.content.data);
      if (target) router.push(target);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const target = routeFor(response.notification.request.content.data);
      if (target) router.push(target);
    });
    return () => subscription.remove();
  }, [userId]);
}
