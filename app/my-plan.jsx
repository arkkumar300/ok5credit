import React, { useEffect, useState } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,SafeAreaView,ScrollView,Alert,Modal,TextInput,StatusBar,Platform} from 'react-native';
import { useRouter } from 'expo-router';
import {Smartphone,X,Check,FileText,Headphones,Monitor,Image,Package,Share,TrendingUp,Settings,MoreHorizontal,Minus,Plus,User,Award,Clock,ChevronRight,ArrowLeft,Users,CreditCard,Zap,Star,Crown,CheckCircle} from "lucide-react-native";
import { ActivityIndicator, Appbar, Avatar, RadioButton } from 'react-native-paper';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import moment from "moment";
import { LinearGradient } from 'expo-linear-gradient';

const YOUR_RAZORPAY_KEY_ID = "rzp_test_RfcfxfJ2sIZdao";

// Plan icon mapping
const getPlanIcon = (planName) => {
  if (planName?.toLowerCase().includes('basic')) return <Users size={22} color="#0A4D3C" />;
  if (planName?.toLowerCase().includes('premium')) return <Crown size={22} color="#0A4D3C" />;
  if (planName?.toLowerCase().includes('corporate')) return <Zap size={22} color="#0A4D3C" />;
  return <Star size={22} color="#0A4D3C" />;
};

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
        name: "Aqua Credit",
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Gradient Header */}
      <LinearGradient
        colors={['#0A4D3C', '#0F5E48', '#1A6B55']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Choose Your Plan</Text>
              <Text style={styles.headerSubtitle}>Select the best plan for your business</Text>
            </View>

            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            {/* Plan Header with Icon */}
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <LinearGradient
                  colors={['rgba(10,77,60,0.1)', 'rgba(10,77,60,0.05)']}
                  style={styles.planIconGradient}
                >
                  {getPlanIcon(plan.name)}
                </LinearGradient>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDuration}>{plan.duration}</Text>
                </View>
              </View>

              <View style={[
                styles.radioButton,
                selectedPlan === plan.id && styles.radioButtonSelected
              ]}>
                {selectedPlan === plan.id && <View style={styles.radioButtonInner} />}
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceSection}>
              <Text style={styles.price}>₹{plan.price}</Text>
              <Text style={styles.perUser}>/user</Text>
            </View>

            {/* Max Users */}
            <View style={styles.maxUsersContainer}>
              <Users size={14} color="#64748B" />
              <Text style={styles.maxUsersText}>
                Supports up to <Text style={styles.maxUsersValue}>{plan.maxUsers} users</Text>
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Features */}
            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <LinearGradient
                    colors={['#0A4D3C', '#0F5E48']}
                    style={styles.featureIconContainer}
                  >
                    <Check size={10} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>

            {plan.isActive && (
              <View style={styles.activeBadge}>
                <CheckCircle size={12} color="#0A4D3C" />
                <Text style={styles.activeText}>Active</Text>
              </View>
            )}
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
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Number of Users</Text>
              <TouchableOpacity
                onPress={() => setShowUserModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedPlanData && (
              <>
                <View style={styles.userCountSection}>
                  <Text style={styles.userCountLabel}>How many users need access?</Text>

                  <View style={styles.userCountControls}>
                    <TouchableOpacity
                      style={[styles.userCountButton, userCount <= 1 && styles.userCountButtonDisabled]}
                      onPress={decrementUserCount}
                      disabled={userCount <= 1}
                    >
                      <Minus size={18} color={userCount <= 1 ? "#CBD5E1" : "#0A4D3C"} />
                    </TouchableOpacity>

                    <View style={styles.userCountDisplay}>
                      <Text style={styles.userCountNumber}>{userCount}</Text>
                      <Text style={styles.userCountText}>user{userCount > 1 ? 's' : ''}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.userCountButton, userCount >= selectedPlanData.maxUsers && styles.userCountButtonDisabled]}
                      onPress={incrementUserCount}
                      disabled={userCount >= selectedPlanData.maxUsers}
                    >
                      <Plus size={18} color={userCount >= selectedPlanData.maxUsers ? "#CBD5E1" : "#0A4D3C"} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.priceBreakdownCard}>
                  <Text style={styles.breakdownTitle}>Price Breakdown</Text>

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Plan Price</Text>
                    <Text style={styles.breakdownValue}>₹{selectedPlanData.price} × {userCount} user{userCount > 1 ? 's' : ''}</Text>
                  </View>

                  <View style={styles.breakdownDivider} />

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownTotalLabel}>Total Amount</Text>
                    <Text style={styles.breakdownTotal}>₹{calculateTotalPrice()}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={handleProceedToPayment}
                  disabled={processingPayment}
                  activeOpacity={0.8}
                >
                  {processingPayment ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
                      <ChevronRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </View>
      </Modal>

      {/* Bottom Container - Fixed for Better Visibility */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bottomContainer}
      >
        {selectedPlanData && (
          <View style={styles.selectedPlanSummary}>
            <View>
              <Text style={styles.selectedPlanName}>{selectedPlanData.name}</Text>
              <Text style={styles.selectedPlanDuration}>{selectedPlanData.duration}</Text>
            </View>
            <View style={styles.selectedPlanPriceContainer}>
              <Text style={styles.selectedPlanPrice}>₹{selectedPlanData.price}</Text>
              <Text style={styles.selectedPlanPerUser}>/user</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading || processingPayment || !selectedPlan}
          style={[
            styles.continueButton,
            (!selectedPlan || loading || processingPayment) && styles.continueButtonDisabled
          ]}
          activeOpacity={0.8}
        >
          {loading || processingPayment ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#0A4D3C',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  planDuration: {
    fontSize: 12,
    color: '#64748B',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#0A4D3C',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0A4D3C',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  perUser: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  maxUsersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  maxUsersText: {
    fontSize: 13,
    color: '#475569',
  },
  maxUsersValue: {
    fontWeight: '700',
    color: '#0A4D3C',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(10,77,60,0.1)',
    marginBottom: 20,
  },
  featuresContainer: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  activeBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,77,60,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  activeText: {
    fontSize: 11,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10,77,60,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedPlanSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedPlanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  selectedPlanDuration: {
    fontSize: 12,
    color: '#64748B',
  },
  selectedPlanPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  selectedPlanPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  selectedPlanPerUser: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 2,
  },
  continueButton: {
    backgroundColor: '#0A4D3C',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCountSection: {
    marginBottom: 24,
  },
  userCountLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
    textAlign: 'center',
  },
  userCountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
  },
  userCountButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  userCountButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  userCountDisplay: {
    alignItems: 'center',
  },
  userCountNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  userCountText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  priceBreakdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: 'rgba(10,77,60,0.1)',
    marginVertical: 10,
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  breakdownTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  proceedButton: {
    backgroundColor: '#0A4D3C',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});