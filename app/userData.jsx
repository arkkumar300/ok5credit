import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
  // Fetch user data on screen load
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.get(`user/${USER_ID}`);

      setUserData(response.data);
      await AsyncStorage.setItem("userData",JSON.stringify(response.data))
      setNameInput(response.data.name || '');
    } catch (err) {
      console.error('Failed to fetch user:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitName = async () => {
    if (!nameInput.trim()) return;

    try {
      setSubmitting(true);
      const response = await ApiService.put(`user/${USER_ID}`,{ name: nameInput.trim() });
      console.log("rrr ::",response)
      await fetchUserData(); // refresh with updated name
    } catch (err) {
      console.error('Failed to update name:', err.message);
    } finally {
      setSubmitting(false);
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
          onPress={() => router.replace('/dashboard')}
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
