import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert('Must use physical device for Push Notifications');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Failed to get push token for notifications!');
    return;
  }

  try {
    // 🔥 This gives you the real FCM token (Android) or APNs token (iOS)
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    console.log('FCM Token:', token);

    await AsyncStorage.setItem('UserFCMToken', token);
    return token;
  } catch (error) {
    console.log('Error getting FCM token:', error);
  }
}
