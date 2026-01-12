import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const dataClear = async () => {
      await AsyncStorage.clear()
    }
    dataClear()
  }, [])

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(number);
  };

  const handleContinue = () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (phoneNumber.length === 10) {
      router.push({
        pathname: '/otp',
        params: { mobile: phoneNumber }
      });
    }
  };

  const handleChange = (text) => {
    setPhoneNumber(text);
    // Clear error while typing if valid
    if (validatePhoneNumber(text)) {
      setPhoneError('valid number');
    }else{
      setPhoneError('Invalid number');
    }
  };
  return (
    <ScrollView style={{ backgroundColor: '#fff' }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>Aqua</Text>
          </View>
          <Text style={styles.appName}>Aqua Credit</Text>
          <Text style={styles.tagline}>Digital Khata for Business</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Enter your mobile number</Text>
          <Text style={styles.subtitle}>We'll send you an OTP to verify</Text>

          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={handleChange}
              placeholder="Enter mobile number"
              placeholderTextColor="#aaaaaa"
              keyboardType="numeric"
              maxLength={10}
              autoFocus
            />
          </View>
          <View style={{marginBottom:18}}>

          {phoneNumber ? <Text style={validatePhoneNumber(phoneNumber)?styles.validText:styles.errorText}>{phoneError}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.continueButton, phoneNumber.length === 10 ? styles.continueButtonActive : styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={phoneNumber.length !== 10}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Trusted by 10M+ businesses across India</Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inputErrorBorder: {
    borderColor: '#ff4d4f',
    marginBottom: 22,
  },
  errorText: {
    color: '#ff4d4f',
    marginTop: 6,
    fontSize: 13,textTransform:'capitalize'
  },
  validText: {
    color: '#4CAF50',
    marginTop: 6,
    fontSize: 13,textTransform:'capitalize'
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  countryCode: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginRight: 12,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333333',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333333',
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonActive: {
    backgroundColor: '#4CAF50',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32, marginVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});