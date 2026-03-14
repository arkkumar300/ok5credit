import React, { useState, useRef, useEffect,useContext } from 'react';
import {View,Text,StyleSheet,TextInput,TouchableOpacity,SafeAreaView,Alert,Platform,Dimensions,StatusBar,KeyboardAvoidingView} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Notifications from "expo-notifications";
import { ArrowLeft, Clock, Smartphone, CheckCircle } from 'lucide-react-native';
import ApiService from './components/ApiServices';
import { ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendSMS } from '../hooks/sendSMS';
import { useFCM } from '../hooks/usePushNotification';
import Constants from "expo-constants";
import FirebasePermission from './components/firebasePermission';
import { AuthContext } from './components/AuthContext';

const { width } = Dimensions.get('window');

export default function OTPScreen() {
  // const { fcmToken, notification } = useFCM();
  const [fcmToken, setFcmToken] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false); 
  const [verifying, setVerifying] = useState(false);
  const [genrateOTP, setgenrateOTP] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(null);

  const inputRefs = useRef([]);
  const router = useRouter();
  const { mobile } = useLocalSearchParams();
  const cleanMobile = String(mobile).replace(/\D/g, "").slice(-10);
  const { 
    login,
  } = useContext(AuthContext);
    
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
      const genrateOTP=response.data.otps
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
      login(response.data.user)
      // await AsyncStorage.setItem("userData",JSON.stringify(response.data.user))
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Premium Header - Solid Color */}
      <View style={styles.headerSolid}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#0A4D3C" />
            </TouchableOpacity>

            {/* Decorative Element */}
            <View style={styles.headerDecoration}>
              <View style={[styles.decorationDot, { backgroundColor: '#0A4D3C' }]} />
              <View style={[styles.decorationDot, { backgroundColor: '#0A4D3C', opacity: 0.5 }]} />
              <View style={[styles.decorationDot, { backgroundColor: '#0A4D3C', opacity: 0.2 }]} />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Icon and Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.iconWrapper}>
              <View style={styles.iconSolid}>
                <Smartphone size={32} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to
            </Text>
            <View style={styles.phoneContainer}>
              <Text style={styles.phoneText}>+91 {mobile}</Text>
            </View>
          </View>

          {/* OTP Input Section */}
          <View style={styles.otpSection}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <View key={index} style={styles.otpInputWrapper}>
                  <TextInput
                    ref={ref => (inputRefs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                      focusedIndex === index && styles.otpInputFocused
                    ]}
                    value={digit}
                    onChangeText={value => handleOtpChange(value, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    keyboardType="numeric"
                    maxLength={1}
                    autoFocus={index === 0}
                    selectionColor="#0A4D3C"
                  />
                  {digit && (
                    <View style={styles.checkMark}>
                      <CheckCircle size={12} color="#0A4D3C" />
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Timer Section */}
            <View style={styles.timerContainer}>
              <Clock size={16} color="#64748B" />
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  Resend code in <Text style={styles.timerBold}>{timer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOTP}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Verify Button - Solid Color */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[
                styles.verifyButton,
                otp.every(d => d) ? styles.verifyButtonActive : styles.verifyButtonDisabled
              ]}
              onPress={() => handleVerify()}
              disabled={!otp.every(d => d) || verifying}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify & Continue</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Helper Text */}
            {loading && (
              <View style={styles.helperContainer}>
                <ActivityIndicator size="small" color="#0A4D3C" />
                <Text style={styles.helperText}>Sending OTP...</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Didn't receive the code?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>
                Change number
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSolid: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,77,60,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10,77,60,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decorationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    marginBottom: 24,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  iconSolid: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0A4D3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  phoneContainer: {
    backgroundColor: 'rgba(10,77,60,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.2)',
  },
  phoneText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A4D3C',
    letterSpacing: 0.5,
  },
  otpSection: {
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  otpInputWrapper: {
    position: 'relative',
    width: (width - 80) / 6,
    maxWidth: 52,
  },
  otpInput: {
    width: '100%',
    height: 60,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0A4D3C',
    backgroundColor: '#F8FAFC',
  },
  otpInputFilled: {
    borderColor: '#0A4D3C',
    backgroundColor: 'rgba(10,77,60,0.05)',
  },
  otpInputFocused: {
    borderColor: '#0A4D3C',
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  checkMark: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  timerBold: {
    fontWeight: '700',
    color: '#0A4D3C',
  },
  resendText: {
    fontSize: 14,
    color: '#0A4D3C',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  buttonSection: {
    alignItems: 'center',
  },
  verifyButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonActive: {
    backgroundColor: '#0A4D3C',
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonContent: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  linkText: {
    color: '#0A4D3C',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});