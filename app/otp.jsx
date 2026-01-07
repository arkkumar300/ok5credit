import React, { useState, useRef, useEffect } from 'react';
import {View,Text,StyleSheet,TextInput,TouchableOpacity,SafeAreaView,Alert,Platform} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
// import { router } from 'expo-router';
import * as Notifications from "expo-notifications";
import { ArrowLeft } from 'lucide-react-native';
import ApiService from './components/ApiServices';
import { ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendSMS } from '../hooks/sendSMS';
import { useFCM } from '../hooks/usePushNotification';
import Constants from "expo-constants";
import FirebasePermission from './components/firebasePermission';

export default function OTPScreen() {
  // const { fcmToken, notification } = useFCM();
  const [fcmToken, setFcmToken] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false); 
  const [verifying, setVerifying] = useState(false);
  const [genrateOTP, setgenrateOTP] = useState("");

  const inputRefs = useRef([]);
  const router = useRouter();
  const { mobile } = useLocalSearchParams();
  const cleanMobile = String(mobile).replace(/\D/g, "").slice(-10);
  
  
  // --------------------------
  //  SEND OTP ON SCREEN LOAD
  // --------------------------
  useEffect(() => {
    sendOTP();

    const interval = setInterval(() => {
      setTimer(t => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // --------------------------
  //  SEND OTP (MAIN FUNCTION)
  // --------------------------
  const sendOTP = async () => {
    try {
      setLoading(true);
      const response = await ApiService.post('otp/send',
        { mobile},
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.data.success)
        throw new Error(response.data.message || "Failed to send OTP");
      const genrateOTP=response.data.otp
      await sendSMS(cleanMobile, genrateOTP);

      setOtp(Array(6).fill("")); // clear UI
      inputRefs.current[0]?.focus();

    } catch (error) { 
      console.error("❌ Error sending OTP:", error);
      Alert.alert("Error", "Could not send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // RESEND OTP
  // --------------------------
  const handleResendOTP = async () => {
    try {
      setTimer(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();


      const response = await ApiService.post(
        'otp/resend',
        { mobile },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.data.success)
        throw new Error(response.data.message || "OTP resend failed");

      const genrateOTP=response.data.otp
      await sendSMS(cleanMobile, genrateOTP);

    } catch (error) {
      console.error("❌ Resend OTP error:", error);
      Alert.alert("Error", "Failed to resend OTP.");
    }
  };

  // --------------------------
  // OTP TEXT INPUT HANDLING
  // --------------------------
  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (!value && index > 0) inputRefs.current[index - 1]?.focus();

    if (newOtp.every(d => d !== "")) handleVerify(newOtp.join(""));
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // --------------------------
  // VERIFY OTP
  // --------------------------
  const handleVerify = async (otpCode = otp.join("")) => {
    if (otpCode.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter all 6 digits.");
      return;
    }

    try {
      setVerifying(true);

      const response = await ApiService.post("otp/verify",
        { mobile, otp: otpCode },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.data.success)
        throw new Error(response.data.message || "OTP verification failed");
     
      if (!fcmToken) { 
        Alert.alert("Please wait", "Still generating device token...");
        return;
      }
      await AsyncStorage.setItem("userData",JSON.stringify(response.data.user))
      await addFCMToken(response.data.user);

    } catch (error) {
      console.error("❌ OTP Verification Error:", error);
      Alert.alert("Error", "Invalid OTP. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const getToken = async () => {
      await FirebasePermission();
      const storedToken = await AsyncStorage.getItem("UserFCMToken");
      console.log("🌟 Token after permission:", storedToken);
  
      if (storedToken) setFcmToken(storedToken);
    };
    
    getToken(); 
  }, []);


    

  // --------------------------
  // SAVE FCM TOKEN
  // --------------------------
  const addFCMToken = async (userDetails) => {
    try {
      
      const deviceType = Platform.OS;
      const response = await ApiService.post(
        "fcmToken/",
        {
          user_id: userDetails.id,
          user_mobile: userDetails.mobile,
          fcm_token: fcmToken,
          device_type: deviceType
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.data.success)
        throw new Error(response.data.message || "Failed to register FCM");

      router.replace({
        pathname: "/userData",
        params: { USER_ID: userDetails.id }
      });

    } catch (error) {
      console.error("❌ FCM Error:", error);
      Alert.alert("Error", "Something went wrong while saving FCM token.");
    }
  };

  // --------------------------
  // UI
  // --------------------------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We have sent a 6-digit OTP to {"\n"}
          <Text style={styles.phoneText}>+91 {mobile}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputRefs.current[index] = ref)}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={value => handleOtpChange(value, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              autoFocus={index === 0}
            />
          ))}
        </View>

        <View style={styles.timerContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.verifyButton,
            otp.every(d => d) ? styles.verifyButtonActive : styles.verifyButtonDisabled
          ]}
          onPress={() => handleVerify()}
          disabled={!otp.every(d => d) || verifying}
        >
          {verifying
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.verifyButtonText}>Verify & Continue</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Didn't receive the OTP?{" "}
          <Text style={styles.linkText} onPress={() => router.back()}>
            Change number
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneText: {
    fontWeight: '600',
    color: '#333',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  otpInputFilled: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
  },
  resendText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonActive: {
    backgroundColor: '#4CAF50',
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  linkText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});