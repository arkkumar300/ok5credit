import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default async function FirebasePermission() {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log("📌 Notification Permission Granted");
      const token = await messaging().getToken();
      await AsyncStorage.setItem("UserFCMToken", token);
    } else {
      console.log("❌ Notification Permission Denied");
    }
  } catch (err) {
    console.log("🔥 Permission Error:", err);
  }
}
