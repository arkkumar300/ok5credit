import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Appbar, Avatar, Divider, Card } from 'react-native-paper';
import {
  UserPlus,
  Minus,
  Plus,
  Users,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  X,
  Award,
  Shield,
  CheckCircle,
  Clock,
  ArrowLeft,
  CreditCard,
  User,
  DollarSign,
  Info
} from 'lucide-react-native';
import { AuthContext } from './components/AuthContext';
import ApiService from './components/ApiServices';
import moment from 'moment';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');
const YOUR_RAZORPAY_KEY_ID = "rzp_test_RfcfxfJ2sIZdao"; // Move to env variable

export default function SubscriptionMembersScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [userCount, setUserCount] = useState(1);
  const [additionalUserCount, setAdditionalUserCount] = useState(1);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [nickName, setNickName] = useState('');
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
          setSelectedPlanData(response.data.plan);
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

  const incrementAdditionalUserCount = () => {
    if (selectedPlanData && additionalUserCount < (selectedPlanData.NOU - subscriptionDetails?.purchasedCount)) {
      setAdditionalUserCount(additionalUserCount + 1);
    } else {
      Alert.alert("Limit Reached", `You can add maximum ${selectedPlanData.NOU - subscriptionDetails?.purchasedCount} more users`);
    }
  };

  const decrementAdditionalUserCount = () => {
    if (additionalUserCount > 1) {
      setAdditionalUserCount(additionalUserCount - 1);
    }
  };

  const calculateAdditionalPrice = () => {
    if (!selectedPlanData) return 0;
    return selectedPlanData.price * additionalUserCount;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setNickName('');
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

  const handleAddMoreUsers = () => {
    // Check if user can add more users (within plan limits)
    const maxUsers = selectedPlanData?.NOU || 0;
    const currentUsers = subscriptionDetails?.purchasedCount || 0;

    if (currentUsers >= maxUsers) {
      Alert.alert('Limit Reached', `You have already reached the maximum limit of ${maxUsers} users for this plan.`);
      return;
    }

    setAdditionalUserCount(1);
    setShowUserModal(true);
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

  const handleProceedToAdditionalPayment = () => {
    setShowUserModal(false);
    startAdditionalUsersPayment();
  };

  const startAdditionalUsersPayment = async () => {
    try {
      setProcessingPayment(true);

      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        Alert.alert("Error", "User not found");
        return;
      }
      const userDetails = JSON.parse(userData);
      console.log("userDetails :::", userDetails)
      if (!selectedPlanData || !subscription) {
        Alert.alert("Error", "Subscription details not found");
        return;
      }

      const totalPrice = calculateAdditionalPrice();

      const payload = {
        subscription_id: subscription.id,
        additional_user_count: additionalUserCount,
        user_id: user.id,
        subscriber_name: userDetails.name,
        subscriber_email: userDetails.email,
        subscriber_phone: userDetails.mobile
      };

      console.log("Sending payload:", payload);

      // Create order for additional users
      const res = await ApiService.post(
        `/payment_rozarpay/add-subscription-users`,
        payload,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      const data = res.data;
      if (!data.orderId) {
        Alert.alert("Error", "Unable to create order");
        return;
      }

      // Razorpay options
      const options = {
        description: `Add ${additionalUserCount} more user${additionalUserCount > 1 ? 's' : ''} to subscription`,
        image: "../assets/images/icon.png",
        currency: "INR",
        key: YOUR_RAZORPAY_KEY_ID,
        amount: totalPrice * 100, // Amount in paise
        order_id: data.orderId,
        name: "Aqua Services",
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.mobile
        },
        theme: { color: "#0A4D3C" },
        method: {
          netbanking: true,
          card: true,
          wallet: true,
          emi: true,
          paylater: true,
          upi: true
        }
      };

      RazorpayCheckout.open(options)
        .then(paymentResult => {
          console.log("Additional Users Payment Result:", paymentResult);
          // Verify additional users payment
          verifyAdditionalUsersPayment(options, paymentResult);
        })
        .catch(error => {
          console.log("Payment Error:", error);
          if (error.code === 2) {
            Alert.alert("Payment Cancelled", "You cancelled the payment");
          } else {
            Alert.alert("Payment Failed", error.description || "Something went wrong");
          }
        })
        .finally(() => {
          setProcessingPayment(false);
        });

    } catch (error) {
      console.log("Error starting additional users payment:", error);
      Alert.alert("Error", error.response?.data?.message || "Something went wrong");
      setProcessingPayment(false);
    }
  };

  const verifyAdditionalUsersPayment = async (options, paymentResult) => {
    console.log("verify-additional-users-payment")

    try {
      // Get the list of new users we want to add (we'll add them after payment verification)
      // For now, we'll pass an empty array and handle user creation separately
      const verificationData = {
        razorpay_order_id: options.order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature
      };

      const res = await ApiService.post("/payment_rozarpay/verify-additional-users-payment", verificationData, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (res.data.success) {
        Alert.alert(
          "Success",
          `Payment successful! You can now add ${additionalUserCount} more user${additionalUserCount > 1 ? 's' : ''} to your subscription.`,
          [
            {
              text: "OK",
              onPress: () => {
                // Refresh subscription data to show updated user count
                fetchMembers();
                refreshSubscription();
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", "Payment verification failed");
      }
    } catch (error) {
      console.log("Additional users verification error:", error);
      Alert.alert("Error", error.response?.data?.message || "Payment verification failed");
    }
  };

  const handleSubmit = async () => {
    const userData = await AsyncStorage.getItem("userData");
    if (!validateForm()) return;
    setAddingMember(true);
    try {
      // Step 1: Register the user
      const registerResponse = await ApiService.post('/auth/register', {
        name,
        nickName,
        email: email || `${mobile}@temp.com`, // Create temporary email if not provided
        mobile,
        businessName:user.businessName,
        role: "employee",
        owner_user_id: user.id,
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
      console.log("members::", member);
      // Fetch dashboard data for this member (employee)
      const response = await ApiService.post("/dashboard/businessOwner", {
        userId: member.user.id,
        ownerId: member.user.owner_user_id
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
    const colors = ['#0A4D3C', '#1B6B50', '#2E8B57', '#3CB371', '#66CDAA', '#90EE90'];
    return colors[id % colors.length];
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />
        <LinearGradient
          colors={['#0A4D3C', '#1B6B50']}
          style={styles.loadingHeader}
        >
          <SafeAreaView>
            <View style={styles.loadingHeaderContent}>
              <Text style={styles.loadingHeaderTitle}>Team Members</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#0A4D3C" />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={['#0A4D3C', '#1B6B50']}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Team Members</Text>
              <Text style={styles.headerSubtitle}>
                Manage your subscription members
              </Text>
            </View>

            {subscriptionDetails?.availableSlots > 0 && (
              <TouchableOpacity
                style={styles.headerAddButton}
                onPress={handleAddMember}
              >
                <UserPlus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Subscription Info Card */}
      {subscriptionDetails && (
        <Animatable.View animation="fadeInDown" duration={600}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.infoHeader}>
                <View style={styles.infoTitleContainer}>
                  <Award size={20} color="#0A4D3C" />
                  <Text style={styles.infoTitle}>Subscription Status</Text>
                </View>
                <View style={[
                  styles.slotsBadge,
                  { backgroundColor: subscriptionDetails.availableSlots > 0 ? '#E8F5E9' : '#FEE2E2' }
                ]}>
                  <Text style={[
                    styles.slotsBadgeText,
                    { color: subscriptionDetails.availableSlots > 0 ? '#0A4D3C' : '#DC2626' }
                  ]}>
                    {subscriptionDetails.availableSlots > 0
                      ? `${subscriptionDetails.availableSlots} slots left`
                      : 'Full'}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Users size={16} color="#64748B" />
                  <Text style={styles.statLabel}>Total</Text>
                  <Text style={styles.statValue}>{subscriptionDetails.totalMembers}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Shield size={16} color="#64748B" />
                  <Text style={styles.statLabel}>Purchased</Text>
                  <Text style={styles.statValue}>{subscriptionDetails.purchasedCount}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <CheckCircle size={16} color="#64748B" />
                  <Text style={styles.statLabel}>Available</Text>
                  <Text style={styles.statValue}>{subscriptionDetails.availableSlots}</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(subscriptionDetails.totalMembers / subscriptionDetails.purchasedCount) * 100}%`,
                      }
                    ]}
                  />
                </View>
              </View>

              {/* New plan limit info section */}
              {selectedPlanData && (
                <View style={styles.planLimitInfo}>
                  <View style={styles.planLimitLeft}>
                    <Info size={14} color="#0A4D3C" />
                    <Text style={styles.planLimitText}>
                      Plan Limit: {subscriptionDetails.purchasedCount} / {selectedPlanData.NOU} users
                    </Text>
                  </View>
                  {subscriptionDetails.purchasedCount < selectedPlanData.NOU && (
                    <TouchableOpacity
                      style={styles.addMoreButton}
                      onPress={handleAddMoreUsers}
                    >
                      <Text style={styles.addMoreLink}>Add More</Text>
                      <Plus size={12} color="#0A4D3C" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>
        </Animatable.View>
      )}

      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0A4D3C']}
            tintColor="#0A4D3C"
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          members.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Team Members</Text>
              <View style={styles.listHeaderBadge}>
                <Text style={styles.listHeaderCount}>{members.length} member(s)</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Animatable.View animation="fadeIn" duration={800} style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Users size={50} color="#0A4D3C" />
            </View>
            <Text style={styles.emptyTitle}>No Members Found</Text>
            <Text style={styles.emptySubtext}>
              {subscriptionDetails?.availableSlots > 0
                ? 'Add your first team member to get started'
                : 'No available slots to add members'}
            </Text>
            {subscriptionDetails?.availableSlots > 0 && (
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={handleAddMember}
              >
                <LinearGradient
                  colors={['#0A4D3C', '#1B6B50']}
                  style={styles.emptyAddButtonGradient}
                >
                  <UserPlus size={18} color="#FFFFFF" />
                  <Text style={styles.emptyAddButtonText}>Add Member</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animatable.View>
        }
        renderItem={({ item, index }) => (
          <Animatable.View
            animation="fadeInUp"
            duration={500}
            delay={index * 100}
          >
            <TouchableOpacity
              style={styles.memberCard}
              onPress={() => handleMemberPress(item)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[getRandomColor(item.user.id), getRandomColor(item.user.id + 1)]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {getInitials(item.user.name)}
                </Text>
              </LinearGradient>

              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.user.name || item.user.mobile}</Text>

                {item.user.email && (
                  <View style={styles.detailRow}>
                    <Mail size={12} color="#64748B" />
                    <Text style={styles.detailText}>{item.user.email}</Text>
                  </View>
                )}

                {item.user.mobile && (
                  <View style={styles.detailRow}>
                    <Phone size={12} color="#64748B" />
                    <Text style={styles.detailText}>{item.user.mobile}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Clock size={12} color="#64748B" />
                  <Text style={styles.detailText}>
                    Member since {moment(item.createdAt).format('DD MMM YYYY')}
                  </Text>
                </View>
              </View>

              <View style={styles.chevronContainer}>
                <ChevronRight size={18} color="#0A4D3C" />
              </View>
            </TouchableOpacity>
          </Animatable.View>
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
            <LinearGradient
              colors={['#0A4D3C', '#1B6B50']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Add New Member</Text>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Full Name <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <User size={18} color="#0A4D3C" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter member's full name"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={setName}
                      editable={!addingMember}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Nick Name <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <User size={18} color="#0A4D3C" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter member's nick name"
                      placeholderTextColor="#94A3B8"
                      value={nickName}
                      onChangeText={setNickName}
                      editable={!addingMember}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Mobile Number <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Phone size={18} color="#0A4D3C" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 10-digit mobile number"
                      placeholderTextColor="#94A3B8"
                      value={mobile}
                      onChangeText={setMobile}
                      keyboardType="phone-pad"
                      maxLength={10}
                      editable={!addingMember}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Email Address <Text style={styles.optional}>(Optional)</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color="#0A4D3C" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter email address"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!addingMember}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Password <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Shield size={18} color="#0A4D3C" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter password (min. 6 characters)"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!addingMember}
                    />
                  </View>
                </View>

                <View style={styles.slotsInfo}>
                  <Users size={18} color="#0A4D3C" />
                  <Text style={styles.slotsInfoText}>
                    Available slots: <Text style={styles.slotsInfoBold}>{subscriptionDetails?.availableSlots || 0}</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, addingMember && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={addingMember}
                >
                  <LinearGradient
                    colors={['#0A4D3C', '#1B6B50']}
                    style={styles.submitButtonGradient}
                  >
                    {addingMember ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <UserPlus size={18} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Add Member</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add More Users Modal */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={400} style={styles.addUserModalContent}>
            <LinearGradient
              colors={['#0A4D3C', '#1B6B50']}
              style={styles.addUserModalHeader}
            >
              <Text style={styles.addUserModalTitle}>Add More Users</Text>
              <TouchableOpacity
                onPress={() => setShowUserModal(false)}
                style={styles.addUserModalCloseButton}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            {selectedPlanData && (
              <View style={styles.addUserModalBody}>
                <View style={styles.planInfoBox}>
                  <Award size={20} color="#0A4D3C" />
                  <View style={styles.planInfoText}>
                    <Text style={styles.planInfoTitle}>{selectedPlanData.planName} Plan</Text>
                    <Text style={styles.planInfoSubtitle}>
                      {subscriptionDetails?.purchasedCount}/{selectedPlanData.NOU} users used
                    </Text>
                  </View>
                </View>

                <View style={styles.userCountContainer}>
                  <TouchableOpacity
                    style={[styles.userCountButton, additionalUserCount <= 1 && styles.userCountButtonDisabled]}
                    onPress={decrementAdditionalUserCount}
                    disabled={additionalUserCount <= 1}
                  >
                    <Minus size={20} color={additionalUserCount <= 1 ? "#CBD5E1" : "#0A4D3C"} />
                  </TouchableOpacity>

                  <View style={styles.userCountDisplay}>
                    <Text style={styles.userCountText}>{additionalUserCount}</Text>
                    <Text style={styles.userCountLabel}>
                      User{additionalUserCount > 1 ? 's' : ''}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.userCountButton,
                      additionalUserCount >= (selectedPlanData.NOU - subscriptionDetails?.purchasedCount) &&
                      styles.userCountButtonDisabled
                    ]}
                    onPress={incrementAdditionalUserCount}
                    disabled={additionalUserCount >= (selectedPlanData.NOU - subscriptionDetails?.purchasedCount)}
                  >
                    <Plus
                      size={20}
                      color={additionalUserCount >= (selectedPlanData.NOU - subscriptionDetails?.purchasedCount)
                        ? "#CBD5E1"
                        : "#0A4D3C"
                      }
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.priceBreakdown}>
                  <Text style={styles.breakdownTitle}>Price Breakdown</Text>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Plan Price:</Text>
                    <Text style={styles.breakdownValue}>
                      ₹{selectedPlanData.price} × {additionalUserCount} user{additionalUserCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.breakdownDivider} />
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownTotalLabel}>Total Amount:</Text>
                    <Text style={styles.breakdownTotal}>₹{calculateAdditionalPrice()}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.proceedButton, processingPayment && styles.disabledButton]}
                  onPress={handleProceedToAdditionalPayment}
                  disabled={processingPayment}
                >
                  <LinearGradient
                    colors={['#0A4D3C', '#1B6B50']}
                    style={styles.proceedButtonGradient}
                  >
                    {processingPayment ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <CreditCard size={18} color="#FFFFFF" />
                        <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingHeader: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  loadingHeaderContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  slotsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slotsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0A4D3C',
    borderRadius: 4,
  },
  planLimitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  planLimitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planLimitText: {
    fontSize: 12,
    color: '#64748B',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  addMoreLink: {
    fontSize: 12,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  listHeaderBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  listHeaderCount: {
    fontSize: 12,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A4D3C',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAddButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyAddButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyAddButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 14,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    padding: 20,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  required: {
    color: '#DC2626',
  },
  optional: {
    color: '#64748B',
    fontWeight: '400',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1E293B',
  },
  slotsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#0A4D3C',
  },
  slotsInfoText: {
    fontSize: 14,
    color: '#64748B',
  },
  slotsInfoBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addUserModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  addUserModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  addUserModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addUserModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addUserModalBody: {
    padding: 20,
  },
  planInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#0A4D3C',
  },
  planInfoText: {
    flex: 1,
  },
  planInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  planInfoSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  userCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userCountButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userCountButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  userCountDisplay: {
    alignItems: 'center',
  },
  userCountText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0A4D3C',
  },
  userCountLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  priceBreakdown: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  breakdownTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  breakdownTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A4D3C',
  },
  proceedButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  proceedButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});