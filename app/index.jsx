import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, Image, StyleSheet, Dimensions, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Wallet, TrendingUp, Shield, Zap, ArrowRight } from "lucide-react-native";
import messaging from "@react-native-firebase/messaging";
import FirebasePermission from "./components/firebasePermission";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from 'react-native-animatable';

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
  
  // // Foreground messages
  // useEffect(() => {
  //   const unsubscribe = messaging().onMessage(async remoteMessage => {
  //     console.log("📩 Foreground Message:", remoteMessage);
  //     console.log(remoteMessage.notification?.title || "Notification", remoteMessage.notification?.body || "");
  //   });
  //   return unsubscribe;
  // }, []);

  // Background messages
  // useEffect(() => {
  //   const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
  //     console.log("📌 Notification opened from background:", remoteMessage);
  //     console.log(remoteMessage.notification?.title || "Notification", remoteMessage.notification?.body || "");
  //   });
  //   return unsubscribe;
  // }, []);

  // Quit-state
  // useEffect(() => {
  //   messaging()
  //     .getInitialNotification()
  //     .then(remoteMessage => {
  //       if (remoteMessage) {
  //         console.log("🚀 App opened from quit:", remoteMessage);
  //         console.log(remoteMessage.notification?.title || "Notification", remoteMessage.notification?.body || "");
  //       }
  //     });
  // }, []);

  // Auto navigate after 3 seconds
  useEffect(() => {
    const timer = setTimeout(async () => {
      const isLogin = await AsyncStorage.getItem("isLogin");
      if (isLogin === "true") {
        router.replace('/dashboard');
      } else {
        router.push("/login");
      }
    }, 3000);

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Section */}
        <Animatable.View
          animation="fadeInDown"
          duration={1000}
          style={styles.logoSection}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <Animatable.Text
            animation="fadeInUp"
            delay={300}
            style={styles.appName}
          >
            Aqua Credit
          </Animatable.Text>

          <Animatable.Text
            animation="fadeInUp"
            delay={500}
            style={styles.tagline}
          >
            Digital Khata for Modern Business
          </Animatable.Text>
        </Animatable.View>

        {/* Features Section */}
        <Animatable.View
          animation="fadeInUp"
          delay={800}
          style={styles.featuresSection}
        >
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#10B981' }]}>
              <Wallet size={22} color="#FFFFFF" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Digital Khata</Text>
              <Text style={styles.featureDesc}>Easy customer ledger management</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#10B981' }]}>
              <Zap size={22} color="#FFFFFF" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Instant Updates</Text>
              <Text style={styles.featureDesc}>Real-time transaction tracking</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#10B981' }]}>
              <Shield size={22} color="#FFFFFF" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Secure & Private</Text>
              <Text style={styles.featureDesc}>Bank-level data protection</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Button Section */}
        <Animatable.View
          animation="fadeInUp"
          delay={1100}
          style={styles.buttonSection}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleGetStarted}
            style={styles.getStartedButton}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <ArrowRight size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Trusted by 10,000+ businesses
          </Text>
        </Animatable.View>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <Animatable.View
          animation="slideInLeft"
          duration={2000}
          iterationCount="infinite"
          style={[styles.loadingBar, { backgroundColor: '#10B981' }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A4D3C', // Primary Background
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10B981', // Secondary Color
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  featuresSection: {
    marginVertical: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(16,185,129,0.1)', // Secondary Color with opacity
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)', // Secondary Color with opacity
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  buttonSection: {
    alignItems: 'center',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981', // Secondary Color
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '80%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 10,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  loadingBar: {
    width: '30%',
    height: '100%',
    borderRadius: 2,
  },
});