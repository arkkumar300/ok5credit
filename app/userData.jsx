import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { User, Smartphone, Wallet } from 'lucide-react-native';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserInfo() {
  const [userData, setUserData] = useState(null);
  const [nameInput, setNameInput] = useState('');
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
      const response = await ApiService.put(`user/${USER_ID}`, { name: nameInput.trim() });

      // Update local state without refetching
      setUserData(prev => ({ ...prev, name: response.data.name }));
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
    console.log("🌟 Token after permission:", fcmToken_stored);
    const userMobile = JSON.parse(userData).mobile;
try {
      const response = await ApiService.post('fcmToken/pushNotification', {
        fcm_token: fcmToken_stored,
        title: "Welcome!",
        message: "Welcome to the app!",
        user_mobile:userMobile
      });

      if (!response.data.success) throw new Error(response.data.message || 'Failed to send notification');

      router.replace('/dashboard');
    } catch (error) {
      console.error('❌ FCM token registration error:', error.message);
      Alert.alert('Error', error.message || 'Something went wrong while sending push notification.');
    }
  };

  const renderUserInfoCard = () => (
    <Card style={styles.card}>
      <Card.Title
        title={userData.name}
        subtitle={`User ID: ${userData.id}`}
        left={(props) => <Avatar.Icon {...props} icon="account" />}
      />
      <Card.Content>
        <View style={styles.row}>
          <Smartphone size={20} />
          <Text style={styles.infoText}>  {userData.mobile}</Text>
        </View>
        <View style={styles.row}>
          <Wallet size={20} />
          <Text style={styles.infoText}>  Balance: ₹{userData.current_balance}</Text>
        </View>
        <Text>Total Credit Given: ₹{userData.total_credit_given}</Text>
        <Text>Total Payment Received: ₹{userData.total_payment_got}</Text>
      </Card.Content>
    </Card>
  );

  const renderNameInputForm = () => (
    <Card style={styles.card}>
      <Card.Title title="Complete Your Profile" left={(props) => <Avatar.Icon {...props} icon="pencil" />} />
      <Card.Content>
        <TextInput
          label="Enter your name"
          mode="outlined"
          value={nameInput}
          onChangeText={setNameInput}
          left={<TextInput.Icon icon={() => <User size={20} />} />}
          style={{ marginBottom: 16 }}
        />
        <Button
          mode="contained"
          onPress={handleSubmitName}
          loading={submitting}
          disabled={!nameInput.trim()}
        >
          Submit
        </Button>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading user data...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {userData?.name ? renderUserInfoCard() : renderNameInputForm()}

      {userData?.name && (
        <Button
          mode="contained-tonal"
          style={styles.continueButton}
          onPress={sendWelcomePushNotification}
        >
          Continue to Dashboard
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  card: {
    marginBottom: 30,
  },
  continueButton: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoText: {
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
