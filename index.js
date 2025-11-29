import "expo-router/entry";
import messaging from "@react-native-firebase/messaging";

// Background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log("📨 Background message:", remoteMessage);
});

// App opened from quit state
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      console.log("🚀 App opened from quit:", remoteMessage);
    }
  });

// App opened from background tap
messaging().onNotificationOpenedApp(remoteMessage => {
  console.log("📌 Notification opened:", remoteMessage);
});
