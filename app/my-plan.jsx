import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Smartphone, X, Check, FileText, Headphones, Monitor, Image, Package, Share, TrendingUp, Settings, MoreHorizontal, Minus, Plus, User } from "lucide-react-native";
import { ActivityIndicator, Appbar, Avatar, RadioButton } from 'react-native-paper';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import moment from "moment";

const YOUR_RAZORPAY_KEY_ID = "rzp_test_RfcfxfJ2sIZdao";

export default function MyPlanScreen() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);

  const router = useRouter();

  // Fetch Plans from API
  const fetchPlans = async () => {
    try {
      const res = await ApiService.get("/plans/", {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = res.data;

      if (!data?.plans) {
        Alert.alert("Error", "Unable to fetch plans");
        return;
      }

      // Transform API response → UI-friendly list
      const formattedPlans = data.plans.map((p) => ({
        id: String(p.id),
        name: p.name,
        price: parseFloat(p.price),
        duration_days: p.duration_days,
        duration: `for ${p.duration_days} days`,
        isActive: p.is_active,
        maxUsers: p.NOU || 10, // Maximum users allowed per plan
        features: p.points.map((pt) => ({
          icon: <Check size={12} color="#f3f3f3" />,
          text: pt
        }))
      }));

      setPlans(formattedPlans);

      // Select first plan by default
      if (formattedPlans.length > 0) {
        setSelectedPlan(formattedPlans[0].id);
        setSelectedPlanData(formattedPlans[0]);
      }

    } catch (error) {
      console.log("Fetch plan error:", error);
      Alert.alert("Error", "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Update selected plan data when plan changes
  useEffect(() => {
    if (selectedPlan && plans.length > 0) {
      const plan = plans.find(p => p.id === selectedPlan);
      setSelectedPlanData(plan);
      // Reset user count to 1 when plan changes
      setUserCount(1);
    }
  }, [selectedPlan, plans]);

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const incrementUserCount = () => {
    if (selectedPlanData && userCount < selectedPlanData.maxUsers) {
      setUserCount(userCount + 1);
    } else {
      Alert.alert("Limit Reached", `Maximum ${selectedPlanData?.maxUsers} users allowed for this plan`);
    }
  };

  const decrementUserCount = () => {
    if (userCount > 1) {
      setUserCount(userCount - 1);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedPlanData) return 0;
    return selectedPlanData.price * userCount;
  };

  const paymentVerify = async (basicData, paymentData) => {
    try {
      console.log("Verifying payment...", { basicData, paymentData });

      // Get user data
      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        Alert.alert("Error", "User data not found. Please login again.");
        return;
      }      
      const userDetails = JSON.parse(userData);

      // Call verification endpoint
      const verifyRes = await ApiService.post(`/payment_rozarpay/verify-payment`, {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        subscriber_phone: userDetails.mobile,
        NOU:userCount
      });
      if (verifyRes.data.success) {
        Alert.alert(
          "Success",
          "Payment successful! Your subscription has been activated.",
          [{ text: "OK", onPress: () => router.push('/dashboard') }]
        );
      } else {
        Alert.alert("Warning", "Payment was successful but verification failed. Please contact support.");
      }
    } catch (error) {
      console.log("Payment verification error:", error);
        Alert.alert(
          "Success",
          "Payment completed! Your subscription will be activated shortly.",
          [{ text: "OK", onPress: () => router.push('/dashboard') }]
        );
    }
  };

  const startPayment = async () => {
    try {
      setProcessingPayment(true);

      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        Alert.alert("Error", "User not found");
        return;
      }
      const userDetails = JSON.parse(userData);

      if (!selectedPlanData) {
        Alert.alert("Error", "Plan not selected");
        return;
      }

      const totalPrice = calculateTotalPrice();

      // Create order
      const res = await ApiService.post(`/payment_rozarpay/create-order`, {
        amount: totalPrice,
        currency: "INR",
        subscriber_name: userDetails.name,
        subscriber_email: userDetails.email,
        subscriber_phone: userDetails.mobile,
        subscribePlan: selectedPlanData.name,
        purchased_user_count: userCount
      }, {
        headers: { "Content-Type": "application/json" }
      });

      const data = res.data;
      if (!data.orderId) {
        Alert.alert("Error", "Unable to create order");
        return;
      }

      // Razorpay options
      const options = {
        description: `Payment for ${selectedPlanData.name} Plan (${userCount} user${userCount > 1 ? 's' : ''})`,
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
        theme: { color: "#0C8CE9" },
        // Enable all payment methods
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
          console.log("Payment Result:", paymentResult);
          // Verify payment
          paymentVerify(options, paymentResult);
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
      console.log("Error starting payment:", error);
      Alert.alert("Error", error.response?.data?.message || "Something went wrong");
      setProcessingPayment(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (!userData) return { eligible: false, reason: "NO_USER" };

      const userId = JSON.parse(userData).id;
      const user = (await ApiService.get(`/user/${userId}`))?.data;
      if (!user) return { eligible: false, reason: "NO_DATA" };

      if (!user.is_active)
        return { eligible: false, reason: "ACCOUNT_INACTIVE" };

      if (!user.is_verified)
        return { eligible: false, reason: "NOT_VERIFIED" };

      if (user.isSubscribe) {
        // Check if subscription is expired
        if (user.subscribeEndAt) {
          const endAt = moment.utc(user.subscribeEndAt, "YYYY-MM-DD HH:mm:ss");
          if (endAt.isAfter(moment.utc())) {
            return { eligible: false, reason: "ACTIVE_SUBSCRIPTION" };
          }
        }
      }

      return { eligible: true };
    } catch (error) {
      console.log("Eligibility error:", error);
      return { eligible: false, reason: "ERROR" };
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    const result = await checkEligibility();
    setLoading(false);
    setEligibilityChecked(true);

    if (result.eligible) {
      // Show user count modal before payment
      setShowUserModal(true);
      return;
    }

    // Handle UI messages
    switch (result.reason) {
      case "NOT_VERIFIED":
        Alert.alert(
          "Account Not Verified",
          "Please verify your account to continue."
        );
        break;

      case "ACTIVE_SUBSCRIPTION":
        Alert.alert(
          "Active Subscription",
          "You already have an active subscription."
        );
        break;

      case "ACCOUNT_INACTIVE":
        Alert.alert(
          "Account Inactive",
          "Your account is inactive. Contact support."
        );
        break;

      default:
        Alert.alert(
          "Error",
          "Unable to check eligibility. Please try again."
        );
    }
  };

  const handleProceedToPayment = () => {
    setShowUserModal(false);
    startPayment();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading Plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Choose Your Plan" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.selectedPlanCard
            ]}
            onPress={() => handlePlanSelect(plan.id)}
            activeOpacity={0.7}
          >
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                )}
              </View>

              <RadioButton
                value={plan.id}
                status={selectedPlan === plan.id ? 'checked' : 'unchecked'}
                onPress={() => handlePlanSelect(plan.id)}
                color="#4CAF50"
              />
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{plan.price}</Text>
              <Text style={styles.duration}> {plan.duration}</Text>
            </View>

            <View style={styles.maxUsersContainer}>
              <User size={16} color="#666" />
              <Text style={styles.maxUsersText}>Supports up to {plan.maxUsers} users</Text>
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>{feature.icon}</View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* User Count Modal */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Number of Users</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedPlanData && (
              <>
                <View style={styles.userCountContainer}>
                  <TouchableOpacity
                    style={styles.userCountButton}
                    onPress={decrementUserCount}
                    disabled={userCount <= 1}
                  >
                    <Minus size={20} color={userCount <= 1 ? "#ccc" : "#4CAF50"} />
                  </TouchableOpacity>

                  <View style={styles.userCountDisplay}>
                    <Text style={styles.userCountText}>{userCount}</Text>
                    <Text style={styles.userCountLabel}>Users</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.userCountButton}
                    onPress={incrementUserCount}
                    disabled={userCount >= selectedPlanData.maxUsers}
                  >
                    <Plus size={20} color={userCount >= selectedPlanData.maxUsers ? "#ccc" : "#4CAF50"} />
                  </TouchableOpacity>
                </View>

                <View style={styles.priceBreakdown}>
                  <Text style={styles.breakdownTitle}>Price Breakdown</Text>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Plan Price:</Text>
                    <Text style={styles.breakdownValue}>₹{selectedPlanData.price} × {userCount} user{userCount > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Total Amount:</Text>
                    <Text style={styles.breakdownTotal}>₹{calculateTotalPrice()}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={handleProceedToPayment}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Container */}
      <View style={styles.bottomContainer}>
        {selectedPlanData && (
          <View style={styles.selectedPlanSummary}>
            <Text style={styles.selectedPlanName}>{selectedPlanData.name}</Text>
            <Text style={styles.selectedPlanPrice}>₹{selectedPlanData.price}/user</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading || processingPayment || !selectedPlan}
          style={[
            styles.continueButton,
            (!selectedPlan || loading || processingPayment) && styles.disabledButton
          ]}
        >
          {loading || processingPayment ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    backgroundColor: 'white',
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedPlanCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  planTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  activeBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500'
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  maxUsersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  maxUsersText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  featuresContainer: {
    gap: 12
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  selectedPlanSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedPlanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedPlanPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  userCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  userCountButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userCountDisplay: {
    alignItems: 'center',
  },
  userCountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  userCountLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  priceBreakdown: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#333',
  },
  breakdownTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  proceedButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});