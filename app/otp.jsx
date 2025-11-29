import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import ApiService from './components/ApiServices';
import { ActivityIndicator } from 'react-native-paper';

export default function OTPScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const router = useRouter();
  const { mobile } = useLocalSearchParams();

  // ✅ Send OTP when screen loads
  useEffect(() => {
    sendOTP();

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ Function to send OTP
  const sendOTP = async () => {
    try {
      setLoading(true)
      const response = await ApiService.post('otp/send', { mobile });

      if (!response.data.success) {
        throw new Error(response.message || 'Failed to send OTP');
      }
      if (response.data.otp && response.data.otp.length === 6) {
        const otpArray = response.data.otp.split('');
        setOtp(otpArray);
        setLoading(false)
      } else {
        console.warn('⚠️ OTP not included in response or invalid');
      }     
      // You can now use response.Verification or response.userId
    } catch (error) {
      console.error('❌ Error sending OTP:', error.message || error);
      // Optionally show alert:
      // Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  // ✅ Function to resend OTP
  const handleResendOTP = async () => {
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();

    try {
      const response = await ApiService.post('otp/resend', { mobile });
    
      // ✅ Since interceptor returns response.data directly:
    
      if (!response.data.success) {
        throw new Error(response.message || 'Failed to send OTP');
      }
      if (response.data.otps && response.data.otps.length === 6) {
        const otpArray = response.data.otps.split('');
        setOtp(otpArray);
      } else {
        console.warn('⚠️ OTP not included in response or invalid');
      }      console.log('✅ OTP resent successfully');
      // You can now use response.Verification or response.userId
    } catch (err) {
      console.error('Resend OTP error:', err.message);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  // ✅ Handle OTP input change
  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ✅ Handle OTP verification
  const handleVerify = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) return;

    try {
      const response = await ApiService.post('otp/verify', { mobile, otp:otpCode });
      const data = response.data;
      if (!response.data.success) throw new Error(data.message || 'OTP verification failed');

      console.log('OTP verified successfully',data.userId);
      router.replace({
        pathname: '/userData',
        params: { USER_ID:data.userId }
      });
    } catch (err) {
      console.error('OTP verify error:', err.message);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    }
  };

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
          We've sent a 6-digit OTP to{'\n'}
          <Text style={styles.phoneText}>+91 {mobile}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
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
            otp.every((digit) => digit !== '')
              ? styles.verifyButtonActive
              : styles.verifyButtonDisabled,
          ]}
          onPress={() => handleVerify()}
          disabled={!otp.every((digit) => digit !== '')}
        >
          <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          {/* : <ActivityIndicator size={'small'} />} */}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Didn't receive the OTP?{' '}
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Change number</Text>
          </TouchableOpacity>
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