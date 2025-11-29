import { useState, useEffect } from "react";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export const useFCM = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [notification, setNotification] = useState(null);

  // Request notification permissions
  const requestUserPermission = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const enabled = finalStatus === "granted";
      console.log("🔔 Notification permission:", enabled);

      if (enabled) {
        await fetchFCMToken();
      } else {
        console.log("🚫 Permission denied, cannot get FCM token");
      }
    } catch (error) {
      console.log("❌ Error requesting permission:", error);
    }
  };

  // Get Expo push token (works with FCM on Android)
  const fetchFCMToken = async () => {
    try {
      if (!Constants.isDevice) {
        console.log("⚠️ Must use physical device for push notifications");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      console.log("🔥 FCM Token:", token);
      setFcmToken(token);
      await AsyncStorage.setItem("UserFCMToken", token);
    } catch (error) {
      console.log("❌ Error fetching FCM token:", error);
    }
  };

  // Listen for foreground notifications
  const listenForNotifications = () => {
    return Notifications.addNotificationReceivedListener((notification) => {
      console.log("📩 Foreground notification:", notification);
      setNotification(notification);

      const title = notification.request.content.title;
      const body = notification.request.content.body;
      Alert.alert(title || "Notification", body || "");
    });
  };

  useEffect(() => {
    requestUserPermission();
    const subscription = listenForNotifications();
    return () => subscription.remove();
  }, []);

  return { fcmToken, notification };
};
