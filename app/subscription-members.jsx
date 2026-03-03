import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Appbar, Avatar } from 'react-native-paper';
import { UserPlus, Users, Mail, Phone, Calendar, ChevronRight, X } from 'lucide-react-native';
import { AuthContext } from './components/AuthContext';
import ApiService from './components/ApiServices';
import moment from 'moment';

export default function SubscriptionMembersScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  
  const router = useRouter();
  const { 
    user, 
    subscription, 
    refreshSubscription,
    isSubscribed 
  } = useContext(AuthContext);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      // First, refresh subscription to get latest data
      await refreshSubscription();
      
      // Get subscription members from API
      if (subscription?.id) {
        const response = await ApiService.get(`/subscriptions/${subscription.id}/members`);
        
        if (response.data) {
          setMembers(response.data.members || []);
          setSubscriptionDetails({
            totalMembers: response.data.total_members || 0,
            purchasedCount: response.data.purchased_user_count || 0,
            availableSlots: response.data.available_slots || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      Alert.alert('Error', 'Failed to load subscription members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isSubscribed) {
        fetchMembers();
      } else {
        router.replace('/my-plan');
      }
    }, [isSubscribed])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setMobile('');
    setPassword('');
  };

  const handleAddMember = () => {
    if (!subscriptionDetails?.availableSlots || subscriptionDetails.availableSlots <= 0) {
      Alert.alert('No Slots Available', 'You have no available slots to add new members.');
      return;
    }
    resetForm();
    setAddModalVisible(true);
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return false;
    }
    if (!mobile.trim()) {
      Alert.alert('Validation Error', 'Mobile number is required');
      return false;
    }
    if (mobile.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return false;
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    console.log("userID::",user.id)
    setAddingMember(true);
    
    try {
      // Step 1: Register the user
      const registerResponse = await ApiService.post('/auth/register', {
        name,
        email: email || `${mobile}@temp.com`, // Create temporary email if not provided
        mobile,
        role:"employee",
        owner_user_id:user.id,
        password
      });

      if (registerResponse.data && registerResponse.data.userId) {
        const newUserId = registerResponse.data.userId;

        // Step 2: Add user to subscription members
        const addMemberResponse = await ApiService.post(
          `/subscriptions/${subscription.id}/members`,
          {
            user_id: newUserId
          }
        );

        if (addMemberResponse.data) {
          Alert.alert('Success', 'Member added successfully');
          setAddModalVisible(false);
          resetForm();
          fetchMembers(); // Refresh the members list
        }
      }
    } catch (error) {
      console.error('Error adding member:', error);
      
      // Handle specific error messages
      if (error.response?.data?.error) {
        Alert.alert('Error', error.response.data.error);
      } else if (error.response?.data?.message) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', 'Failed to add member. Please try again.');
      }
    } finally {
      setAddingMember(false);
    }
  };

  const handleMemberPress = async (member) => {
    try {
      setLoading(true);
      
      // Fetch dashboard data for this member (employee)
      const response = await ApiService.post("/dashboard/businessOwner", { 
        userId: member.user.id,
        created_user: member.user.id 
      });
      
      if (response.data.success) {
        // Navigate to employee dashboard with the fetched data
        router.push({
          pathname: '/employee-dashboard',
          params: {
            userId: member.user.id,
            userName: member.user.name || member.user.mobile,
            userEmail: member.user.email || '',
            customers: JSON.stringify(response.data.Customers || []),
            suppliers: JSON.stringify(response.data.Suppliers || [])
          }
        });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to load employee data');
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      Alert.alert('Error', 'Failed to load employee dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (id) => {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#009688'];
    return colors[id % colors.length];
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Subscription Members" />
        {subscriptionDetails?.availableSlots > 0 && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddMember}
          >
            <UserPlus size={24} color="#4CAF50" />
          </TouchableOpacity>
        )}
      </Appbar.Header>

      {/* Subscription Info Card */}
      {subscriptionDetails && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Users size={20} color="#4CAF50" />
            <Text style={styles.infoText}>
              Total Members: {subscriptionDetails.totalMembers} / {subscriptionDetails.purchasedCount}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(subscriptionDetails.totalMembers / subscriptionDetails.purchasedCount) * 100}%`,
                  backgroundColor: subscriptionDetails.availableSlots > 0 ? '#4CAF50' : '#FF9800'
                }
              ]} 
            />
          </View>
          <Text style={styles.slotsText}>
            {subscriptionDetails.availableSlots > 0 
              ? `${subscriptionDetails.availableSlots} slots available` 
              : 'No slots available'}
          </Text>
        </View>
      )}

      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={60} color="#ccc" />
            <Text style={styles.emptyText}>No members found</Text>
            {subscriptionDetails?.availableSlots > 0 && (
              <TouchableOpacity 
                style={styles.addMemberButton}
                onPress={handleAddMember}
              >
                <Text style={styles.addMemberButtonText}>Add Member</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.memberCard}
            onPress={() => handleMemberPress(item)}
          >
            <Avatar.Text
              size={50}
              label={getInitials(item.user.name)}
              color="#fff"
              style={{ backgroundColor: getRandomColor(item.user.id) }}
            />
            
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.user.name || item.user.mobile}</Text>
              {item.user.email && (
                <View style={styles.detailRow}>
                  <Mail size={14} color="#666" />
                  <Text style={styles.detailText}>{item.user.email}</Text>
                </View>
              )}
              {item.user.mobile && (
                <View style={styles.detailRow}>
                  <Phone size={14} color="#666" />
                  <Text style={styles.detailText}>{item.user.mobile}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Calendar size={14} color="#666" />
                <Text style={styles.detailText}>
                  Member since {moment(item.createdAt).format('DD MMM YYYY')}
                </Text>
              </View>
            </View>
            
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>
        )}
      />

      {/* Add Member Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Member</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={name}
                  onChangeText={setName}
                  editable={!addingMember}
                />

                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!addingMember}
                />

                <Text style={styles.label}>Email (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!addingMember}
                />

                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password (min. 6 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!addingMember}
                />

                <View style={styles.slotsInfo}>
                  <Users size={16} color="#4CAF50" />
                  <Text style={styles.slotsInfoText}>
                    Available slots: {subscriptionDetails?.availableSlots || 0}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, addingMember && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={addingMember}
                >
                  {addingMember ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add Member</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    marginRight: 16,
    padding: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  slotsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  addMemberButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addMemberButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  slotsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  slotsInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});