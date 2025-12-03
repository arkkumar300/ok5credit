import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Smartphone } from "lucide-react-native";
import messaging from "@react-native-firebase/messaging";
import FirebasePermission from "./components/firebasePermission";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen() {
  const [showGetStarted, setShowGetStarted] = useState(false);
  const router = useRouter();

  // Only call FirebasePermission inside useEffect
  useEffect(() => {
    const getToken = async () => {
      await FirebasePermission();
      const storedToken = await AsyncStorage.getItem("UserFCMToken");
      console.log("🌟 Token after permission:", storedToken);
  
      if (storedToken) setShowGetStarted(true);
    };
    
    getToken(); 
  }, []);
  
  // Foreground messages
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log("📩 Foreground Message:", remoteMessage);
      console.log(remoteMessage.notification?.title || "Notification", remoteMessage.notification?.body || "");
    });
    return unsubscribe;
  }, []);

  // Background messages
  useEffect(() => {
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log("📌 Notification opened from background:", remoteMessage);
      console.log(remoteMessage.notification?.title || "Notification", remoteMessage.notification?.body || "");
    });
    return unsubscribe;
  }, []);

  // Quit-state
  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log("🚀 App opened from quit:", remoteMessage);
          console.log(remoteMessage.notification?.title || "Notification", remoteMessage.notification?.body || "");
        }
      });
  }, []);

  // Show button after 2 sec
  useEffect(() => {
    const timer = setTimeout(() => setShowGetStarted(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = async () => {
const isLogin=await AsyncStorage.getItem("isLogin")
if (isLogin) {
  router.replace('/dashboard');
} else {
  router.push("/login");
}
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}><Text style={styles.logoText}>Aqua</Text></View>
            <Text style={styles.appName}>Aqua Credit</Text>
            <Text style={styles.tagline}>Digital Khata for Business</Text>
          </View>
          <View style={styles.illustrationContainer}>
            <Image
              source={{ uri: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400&h=300" }}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
          <View style={styles.featuresContainer}>
            <View style={styles.feature}><Smartphone size={24} color="#4CAF50" /><Text style={styles.featureText}>Easy to use digital khata</Text></View>
            <View style={styles.feature}><View style={styles.featureIcon}><Text style={styles.featureIconText}>₹</Text></View><Text style={styles.featureText}>Track all your transactions</Text></View>
            <View style={styles.feature}><View style={styles.featureIcon}><Text style={styles.featureIconText}>🔒</Text></View><Text style={styles.featureText}>100% secure and private</Text></View>
          </View>
        </View>

        {showGetStarted && (
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  content: { alignItems: "center", padding: 20 },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  logo: { backgroundColor: "#4CAF50", borderRadius: 50, padding: 15 },
  logoText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  appName: { fontSize: 28, fontWeight: "bold", marginTop: 10 },
  tagline: { fontSize: 16, color: "#555" },
  illustrationContainer: { marginVertical: 30 },
  illustration: { width: 300, height: 200 },
  featuresContainer: { marginTop: 20 },
  feature: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  featureIcon: { marginRight: 10 },
  featureIconText: { fontSize: 20 },
  featureText: { fontSize: 16, color: "#333" },
  getStartedButton: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 10, marginVertical: 20, alignSelf: "center" },
  getStartedText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});
