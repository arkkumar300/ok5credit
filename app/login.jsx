import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Image, ScrollView, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, Smartphone, Shield, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header - Solid Color */}
      <View style={styles.headerSolid}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/images/aqualogo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.appName}>Aqua Credit</Text>
            <Text style={styles.tagline}>Digital Khata for Business</Text>

            {/* Decorative Elements */}
            <View style={styles.decorativeLine} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          {/* Premium Card */}
          <View style={styles.premiumCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Smartphone size={24} color="#0A4D3C" />
              </View>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>Enter your mobile number to continue</Text>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Mobile Number</Text>

              <View style={[
                styles.phoneInputContainer,
                isFocused && styles.phoneInputContainerFocused,
                phoneError && phoneNumber.length > 0 && styles.phoneInputContainerError
              ]}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <View style={styles.divider} />
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={handleChange}
                  placeholder="98765 43210"
                  placeholderTextColor="rgba(10,77,60,0.3)"
                  keyboardType="numeric"
                  maxLength={10}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>

              {/* Validation Message */}
              {phoneNumber.length > 0 && (
                <View style={styles.validationContainer}>
                  <View style={[
                    styles.validationDot,
                    validatePhoneNumber(phoneNumber) ? styles.validationDotValid : styles.validationDotInvalid
                  ]} />
                  <Text style={[
                    styles.validationText,
                    validatePhoneNumber(phoneNumber) ? styles.validText : styles.errorText
                  ]}>
                    {validatePhoneNumber(phoneNumber) ? 'Valid mobile number' : phoneError || 'Invalid mobile number'}
                  </Text>
                </View>
              )}
            </View>

            {/* Continue Button - Solid Color */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                phoneNumber.length === 10 ? styles.continueButtonActive : styles.continueButtonInactive
              ]}
              onPress={handleContinue}
              disabled={phoneNumber.length !== 10}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.continueButtonText}>Continue</Text>
                <ChevronRight size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Terms Text */}
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Trust Badge */}
          <View style={styles.trustBadge}>
            <Shield size={16} color="#0A4D3C" />
            <Text style={styles.trustText}>100% Secure • OTP Verification</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Trusted by 10M+ businesses across India</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSolid: {
    backgroundColor: '#0A4D3C',
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    marginBottom: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  decorativeLine: {
    width: 60,
    height: 3,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    borderRadius: 2,
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(10,77,60,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A4D3C',
    marginBottom: 8,
    marginLeft: 4,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  phoneInputContainerFocused: {
    borderColor: '#0A4D3C',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  phoneInputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 4,
  },
  validationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  validationDotValid: {
    backgroundColor: '#0A4D3C',
  },
  validationDotInvalid: {
    backgroundColor: '#EF4444',
  },
  validationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
  },
  validText: {
    color: '#0A4D3C',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonActive: {
    backgroundColor: '#0A4D3C',
  },
  continueButtonInactive: {
    backgroundColor: '#CCCCCC',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#0A4D3C',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(10,77,60,0.05)',
    borderRadius: 30,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  trustText: {
    fontSize: 13,
    color: '#0A4D3C',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
});