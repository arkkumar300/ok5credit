import React, { useEffect, useState } from 'react';
import {View,StyleSheet,ScrollView,Alert,Platform,Dimensions,StatusBar,TouchableOpacity} from 'react-native';
import { Text, TextInput, Button, Card, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { User, Smartphone, Wallet, Store, CheckCircle, ArrowRight, Award, TrendingUp } from 'lucide-react-native';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function UserInfo() {
  const [userData, setUserData] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [nickNameInput, setNickNameInput] = useState('');
  const [businessNameInput, setBusinessNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { USER_ID } = useLocalSearchParams();
  const [fcmToken, setFcmToken] = useState(null);

  // Fetch user data on mount
  useEffect(() => {
    if (USER_ID) fetchUserData();
  }, [USER_ID]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.get(`user/${USER_ID}`);
      setUserData(response.data);
      setNameInput(response.data.name || '');
      setNickNameInput(response.data.nickName)
      await AsyncStorage.setItem("isLogin", "true");
      await AsyncStorage.setItem("userData", JSON.stringify(response.data));
    } catch (err) {
      console.error('Failed to fetch user:', err.message);
      Alert.alert('Error', 'Failed to fetch user data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitName = async () => {
    if (!nameInput.trim()) return;

    try {
      setSubmitting(true);
      const response = await ApiService.put(`user/${USER_ID}`, { name: nameInput.trim(),businessName:businessNameInput });

      // Update local state without refetching
      setUserData(prev => ({ ...prev, name: response.data.name }));
      await AsyncStorage.setItem("isLogin", "true");
      await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));
      sendWelcomePushNotification();
    } catch (err) {
      console.error('Failed to update name:', err.message);
      Alert.alert('Error', 'Failed to update name.');
    } finally {
      setSubmitting(false);
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


  const sendWelcomePushNotification = async () => {
    const userData = await AsyncStorage.getItem("userData");
    const fcmToken_stored = await AsyncStorage.getItem("UserFCMToken");
     const userMobile = JSON.parse(userData).mobile;
    
    try {
      const response = await ApiService.post('fcmToken/pushNotification', {
        fcm_token: fcmToken_stored,
        title: "Welcome!",
        message: "Welcome to the app!",
        user_mobile:userMobile
      });

      if (!response.data.success) throw new Error(response.data.message || 'Failed to send notification');

    } catch (error) {
      console.error('❌ FCM token registration error:', error.message);
    }finally{
      router.replace('/dashboard');

    }
  };

  const renderUserInfoCard = () => (
    <Animatable.View animation="fadeInUp" duration={800} style={styles.cardWrapper}>
      <View style={styles.solidCard}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarSolid}>
              <Avatar.Icon
                size={60}
                icon="account"
                color="#FFFFFF"
                style={styles.avatarIcon}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData.name}</Text>
              <View style={styles.userBadge}>
                <CheckCircle size={14} color="#0A4D3C" />
                <Text style={styles.userBadgeText}>Verified User</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Wallet size={20} color="#0A4D3C" />
            <Text style={styles.statLabel}>Balance</Text>
            <Text style={styles.statValue}>₹{userData.current_balance || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <TrendingUp size={20} color="#0A4D3C" />
            <Text style={styles.statLabel}>Credit Given</Text>
            <Text style={styles.statValue}>₹{userData.total_credit_given || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Award size={20} color="#0A4D3C" />
            <Text style={styles.statLabel}>Received</Text>
            <Text style={styles.statValue}>₹{userData.total_payment_got || 0}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Smartphone size={18} color="#0A4D3C" />
            </View>
            <Text style={styles.detailLabel}>Mobile Number</Text>
            <Text style={styles.detailValue}>+91 {userData.mobile}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Store size={18} color="#0A4D3C" />
            </View>
            <Text style={styles.detailLabel}>Business</Text>
            <Text style={styles.detailValue}>{userData.businessName || 'Not added'}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <User size={18} color="#0A4D3C" />
            </View>
            <Text style={styles.detailLabel}>User ID</Text>
            <Text style={styles.detailValue}>#{userData.id}</Text>
          </View>
        </View>
      </View>
    </Animatable.View>
  );

  const renderNameInputForm = () => (
    <Animatable.View animation="fadeInUp" duration={800} style={styles.cardWrapper}>
      <View style={styles.solidCard}>
        <View style={styles.formHeader}>
          <View style={styles.formIconSolid}>
            <User size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.formTitle}>Complete Your Profile</Text>
          <Text style={styles.formSubtitle}>Please enter your details to continue</Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <User size={20} color="#0A4D3C" style={styles.inputIcon} />
            <TextInput
              label=""
              placeholder="Enter your full name"
              mode="flat"
              value={nameInput}
              onChangeText={setNameInput}
              style={styles.input}
              theme={{ colors: { primary: '#0A4D3C', underlineColor: 'transparent' } }}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Store size={20} color="#0A4D3C" style={styles.inputIcon} />
            <TextInput
              label=""
              placeholder="Enter your business name"
              mode="flat"
              value={businessNameInput}
              onChangeText={setBusinessNameInput}
              style={styles.input}
              theme={{ colors: { primary: '#0A4D3C', underlineColor: 'transparent' } }}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmitName}
            disabled={!nameInput.trim() || submitting}
            activeOpacity={0.8}
            style={styles.submitButtonWrapper}
          >
            <View style={[
              styles.submitButton,
              nameInput.trim() ? styles.submitButtonActive : styles.submitButtonInactive
            ]}>
              {submitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit & Continue</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Animatable.View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingSolid}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={1500}
            style={styles.loadingContent}
          >
            <View style={styles.loadingLogo}>
              <Text style={styles.loadingLogoText}>A</Text>
            </View>
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </Animatable.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header - Solid Color */}
      <View style={styles.headerSolid}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Aqua Credit</Text>
            <Text style={styles.headerSubtitle}>Complete your profile</Text>
          </View>
          <View style={styles.headerDecoration}>
            <View style={[styles.decorationDot, { backgroundColor: '#FFFFFF', opacity: 1 }]} />
            <View style={[styles.decorationDot, { backgroundColor: '#FFFFFF', opacity: 0.5 }]} />
            <View style={[styles.decorationDot, { backgroundColor: '#FFFFFF', opacity: 0.2 }]} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {userData?.name ? renderUserInfoCard() : renderNameInputForm()}

        {userData?.name && (
          <Animatable.View animation="fadeInUp" delay={300} style={styles.continueWrapper}>
            <TouchableOpacity
              onPress={sendWelcomePushNotification}
              activeOpacity={0.8}
              style={styles.continueButtonWrapper}
            >
              <View style={styles.continueButton}>
                <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.trustBadge}>
              <CheckCircle size={14} color="#0A4D3C" />
              <Text style={styles.trustText}>Your information is secure with us</Text>
            </View>
          </Animatable.View>
        )}
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  decorationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  solidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
  },
  cardHeader: {
    marginBottom: 16,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarSolid: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0A4D3C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarIcon: {
    backgroundColor: 'transparent',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,77,60,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  userBadgeText: {
    fontSize: 12,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(10,77,60,0.1)',
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: 'rgba(10,77,60,0.03)',
    borderRadius: 16,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(10,77,60,0.2)',
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10,77,60,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formIconSolid: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0A4D3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  inputContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 16,
    height: 56,
  },
  submitButtonWrapper: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonActive: {
    backgroundColor: '#0A4D3C',
  },
  submitButtonInactive: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  continueWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  continueButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#0A4D3C',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: 'rgba(10,77,60,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
  },
  trustText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingSolid: {
    width: width,
    height: '100%',
    backgroundColor: '#0A4D3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
  },
  loadingLogoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.9,
  },
});