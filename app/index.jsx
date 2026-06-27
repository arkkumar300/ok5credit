import React, { useState, useEffect, useRef } from "react";
import {View,Text,TouchableOpacity,Image,StyleSheet,StatusBar,Alert,Platform} from "react-native";
import { useRouter } from "expo-router"; // ← added useURL
import * as Linking from 'expo-linking'; // Correct import for useURL
import { Wallet, Shield, Zap, ArrowRight } from "lucide-react-native";
import FirebasePermission from "./components/firebasePermission";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";
import * as LocalAuthentication from "expo-local-authentication";
import { captureReferralCode } from "./components/referral";

export default function SplashScreen() {
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
  const router = useRouter();
  const url = Linking.useURL();
    const deepLinkHandled = useRef(false); // prevent double handling

  // ---------- Biometric / security functions (unchanged) ----------
  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) return false;
      return true;
    } catch (error) {
      console.error("Error checking biometric support:", error);
      return false;
    }
  };

  const authenticateUser = async () => {
    try {
      setIsAuthenticating(true);
      const isBiometricAvailable = await checkBiometricSupport();
      const options = {
        promptMessage: "Verify your identity to access Aqua Credit",
        fallbackLabel: "Use device passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      };
      const result = isBiometricAvailable
        ? await LocalAuthentication.authenticateAsync(options)
        : await LocalAuthentication.authenticateAsync({
            ...options,
            promptMessage: "Authenticate to access Aqua Credit",
          });
      setIsAuthenticating(false);
      return result.success;
    } catch (error) {
      console.error("Authentication error:", error);
      setIsAuthenticating(false);
      return false;
    }
  };

  const checkSecurityEnabled = async () => {
    try {
      const securityEnabled = await AsyncStorage.getItem("isSecurityEnabled");
      const isEnabled = securityEnabled === "true";
      setIsSecurityEnabled(isEnabled);
      return isEnabled;
    } catch (error) {
      console.error("Error checking security status:", error);
      return false;
    }
  };

  const navigateToDashboard = async () => {
    const isSecurityEnabledFlag = await checkSecurityEnabled();
    if (isSecurityEnabledFlag) {
      // const authSuccess = await authenticateUser();
      // if (authSuccess) {
        router.replace("/dashboard");
      // } else {
      //   Alert.alert(
      //     "Authentication Failed",
      //     "Unable to verify your identity. Please try again.",
      //     [
      //       { text: "Try Again", onPress: () => navigateToDashboard() },
      //       {
      //         text: "Exit",
      //         onPress: () => {
      //           if (Platform.OS === "android") {
      //             Alert.alert("Exit", "Do you want to exit the app?", [
      //               { text: "Cancel", style: "cancel" },
      //               {
      //                 text: "Exit",
      //                 onPress: () => require("react-native").BackHandler.exitApp(),
      //               },
      //             ]);
      //           }
      //         },
      //         style: "cancel",
      //       },
      //     ]
      //   );
      // }
    } else {
      router.replace("/dashboard");
    }
  };

  // ---------- Deep link extraction ----------
/**
 * Extract the invite code from a deep link URL.
 * Supports:
 *   - https://domain.com/refer?inviteCode=XYZ
 *   - https://domain.com/refer/XYZ
 *   - https://domain.com/LoginScreen?inviteCode=XYZ
 *   - aquacredit://LoginScreen?inviteCode=XYZ
 */
const extractInviteCodeFromURL = (incomingUrl) => {
  if (!incomingUrl) return null;

  try {
    // Use the URL constructor to parse the URL properly
    const url = new URL(incomingUrl);
    
    // 1. First, check the query parameter "inviteCode"
    const inviteCodeParam = url.searchParams.get('inviteCode');
    if (inviteCodeParam) return inviteCodeParam;

    // 2. If no query param, check the path segments (e.g., /refer/XYZ)
    const pathSegments = url.pathname.split('/').filter(seg => seg.length > 0);
    // If the last segment looks like a code (and not a screen name like "LoginScreen")
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      // Avoid matching screen names like "LoginScreen", "RegisterScreen"
      if (!lastSegment.match(/Screen$/i) && lastSegment.length > 3) {
        return lastSegment;
      }
    }
    return null;
  } catch (error) {
    // Fallback for custom schemes like "aquacredit://..."
    if (incomingUrl.includes('://')) {
      const [scheme, rest] = incomingUrl.split('://');
      const [hostAndPath, query] = rest.split('?');
      if (query) {
        const params = new URLSearchParams(query);
        const inviteCode = params.get('inviteCode');
        if (inviteCode) return inviteCode;
      }
      // Check if the path itself (without query) is a code
      const pathParts = hostAndPath.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && !lastPart.match(/Screen$/i) && lastPart.length > 3) {
        return lastPart;
      }
    }
    return null;
  }
};
  // ---------- Initial setup ----------
  useEffect(() => {
    const getToken = async () => {
      await FirebasePermission();
      const storedToken = await AsyncStorage.getItem("UserFCMToken");
      if (storedToken) setShowGetStarted(true);
    };
    getToken();
    checkSecurityEnabled();
  }, []);

  // ---------- Navigation logic (handles deep link first) ----------
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Avoid double handling if deep link was already processed
      if (deepLinkHandled.current) return;

      // 1. Check for deep link invite code
      const inviteCode = extractInviteCodeFromURL(url);

      if (inviteCode) {
        deepLinkHandled.current = true;
        // Navigate directly to LoginScreen with the invite code
        router.push({
          pathname: "/login",
          params: { inviteCode },
        });
        return;
      }

      // 2. No deep link – proceed with normal auth flow
      const isLogin = await AsyncStorage.getItem("isLogin");
      if (isLogin === "true") {
        await navigateToDashboard();
      } else {
        router.push("/login");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [url]); // re-run if the deep link URL changes (e.g., app already open)

  //referal link
  // useEffect(()=>{
  //  const refererCode= captureReferralCode();
  // })
  
  const handleGetStarted = async () => {
    const isLogin = await AsyncStorage.getItem("isLogin");
    if (isLogin === "true") {
      await navigateToDashboard();
    } else {
      router.push("/login");
    }
  };

  // (Optional security toggle – you can keep or remove)
  const toggleSecurity = async (enabled) => {
    try {
      await AsyncStorage.setItem("isSecurityEnabled", enabled.toString());
      setIsSecurityEnabled(enabled);
      console.log(`Security ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error toggling security:", error);
    }
  };

  // ---------- UI (unchanged) ----------
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {isAuthenticating && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Animatable.View
              animation="rotate"
              iterationCount="infinite"
              duration={1000}
              style={styles.loadingSpinner}
            >
              <View style={styles.spinnerInner} />
            </Animatable.View>
            <Text style={styles.overlayText}>Authenticating...</Text>
          </View>
        </View>
      )}

      <View style={styles.content}>
        <Animatable.View
          animation="fadeInDown"
          duration={1000}
          style={styles.logoSection}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image
                source={require("../assets/images/icon.png")}
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

        <Animatable.View
          animation="fadeInUp"
          delay={800}
          style={styles.featuresSection}
        >
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#10B981" }]}>
              <Wallet size={22} color="#FFFFFF" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Digital Khata</Text>
              <Text style={styles.featureDesc}>
                Easy customer ledger management
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#10B981" }]}>
              <Zap size={22} color="#FFFFFF" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Instant Updates</Text>
              <Text style={styles.featureDesc}>
                Real-time transaction tracking
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#10B981" }]}>
              <Shield size={22} color="#FFFFFF" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Secure & Private</Text>
              <Text style={styles.featureDesc}>
                Bank-level data protection
              </Text>
            </View>
          </View>
        </Animatable.View>

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

      <View style={styles.loadingContainer}>
        <Animatable.View
          animation="slideInLeft"
          duration={2000}
          iterationCount="infinite"
          style={[styles.loadingBar, { backgroundColor: "#10B981" }]}
        />
      </View>
    </View>
  );
}

// Styles (unchanged, same as your original)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A4D3C" },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: { alignItems: "center" },
  logoContainer: {
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#10B981",
  },
  logoImage: { width: 70, height: 70 },
  appName: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  featuresSection: { marginVertical: 20 },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(16,185,129,0.1)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  featureTextContainer: { flex: 1 },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  featureDesc: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  buttonSection: { alignItems: "center" },
  getStartedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: "80%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginRight: 10,
  },
  footerText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    textAlign: "center",
  },
  loadingContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  loadingBar: { width: "30%", height: "100%", borderRadius: 2 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 200,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  spinnerInner: {
    width: 30,
    height: 30,
    borderWidth: 3,
    borderColor: "#10B981",
    borderTopColor: "transparent",
    borderRadius: 15,
  },
  overlayText: { fontSize: 16, color: "#0A4D3C", fontWeight: "600" },
});