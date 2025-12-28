import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Smartphone, X, Check, FileText, Headphones, Monitor, Image, Package, Share, TrendingUp, Settings, MoreHorizontal } from "lucide-react-native";
import { ActivityIndicator, Appbar, Avatar } from 'react-native-paper';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import moment from "moment";

const YOUR_RAZORPAY_KEY_ID = "rzp_test_RfcfxfJ2sIZdao";

// Icons (adjust import according to your setup)

export default function MyPlanScreen() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // 🔥 Fetch Plans from API
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
        price: `₹${p.price}`,
        duration: `for ${p.duration_days} days`,
        isActive: p.is_active,
        features: p.points.map((pt) => ({
          icon: <Check size={12} color="#f3f3f3" />,
          text: pt
        }))
      }));

      setPlans(formattedPlans);

      // Select first plan by default
      if (formattedPlans.length > 0) {
        setSelectedPlan(formattedPlans[0].id);
      }

    } catch (error) {
      console.log("Fetch plan error:", error);
      Alert.alert("Error", "Failed to load plans");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handlePlanSelect = (planId) => setSelectedPlan(planId);

  const startPayment = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        Alert.alert("Error", "User not found");
        return;
      }
      const userDetails = JSON.parse(userData);

      const selected = plans.find((p) => p.id === selectedPlan);

      if (!selected) {
        Alert.alert("Error", "Plan not selected");
        return;
      }
      const price = Number(selected.price.replace("₹", ""));
      const res = await ApiService.post(`/payment_rozarpay/create-order`, {
        amount: Number(selected.price.replace("₹", "")),
        currency: "INR",
        subscriber_name: userDetails.name,
        subscriber_email: userDetails.email,
        subscriber_phone: userDetails.mobile,
        subscribePlan: selected.name
      }, {
        headers: { "Content-Type": "application/json" }
      });

      const data = res.data;
      if (!data.orderId) {
        Alert.alert("Error", "Unable to create order");
        return;
      }

      const options = {
        description: "Payment for Aqua Services",
        image: "../assets/images/icon.png",
        currency: "INR",
        key: YOUR_RAZORPAY_KEY_ID,
        amount: price,
        order_id: data.orderId,
        name: "Aqua Services",
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.mobile
        },
        theme: { color: "#0C8CE9" },

        // ⭐ Restrict only to UPI
        method: {
          netbanking: false,
          card: false,
          wallet: false,
          emi: false,
          paylater: false,
          upi: true
        },

        // ⭐ Optional: Force only UPI Apps  
        "upi_app": "default",
      };

      RazorpayCheckout.open(options)
        .then(paymentResult => {
          Alert.alert("Success", `Payment ID: ${paymentResult.razorpay_payment_id}`);
          paymentVerify(options, paymentResult);
        })
        .catch(error => {
          Alert.alert("Payment Failed", error.description || "Something went wrong");
          console.log("Payment Failed:", error);
        });

    } catch (error) {
      console.log("Error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const paymentVerify = (basicData, paymentData) => {
    console.log("basicData::", basicData);
    console.log("paymentData::", paymentData);
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
  
      if (user.isSubscribe)
        return { eligible: false, reason: "ALREADY_SUBSCRIPTION" };
  
     // ------------------------------
      // Subscription expiration check
      // ------------------------------
      if (user.subscribeEndAt) {
        // Parse DB string correctly
        const endAt = moment.utc(user.subscribeEndAt, "YYYY-MM-DD HH:mm:ss");
  console.log("now ::",moment.utc())
        // Compare with current UTC time
        if (endAt.isAfter(moment.utc())) {
          return { eligible: false, reason: "SUBSCRIPTION_EXPIRED" };
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

    if (result.eligible) {
      startPayment();
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

      case "ALREADY_SUBSCRIPTION":
        Alert.alert(
          "Already Subscribed",
          "Please subscribe After subscription finished."
        );
        break;

      case "SUBSCRIPTION_EXPIRED":
        Alert.alert(
          "Subscription Expired",
          "Your subscription has expired. Please renew."
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

  if (loading) {
    return (
      <SafeAreaView>
        <Text style={{ textAlign: "center", marginTop: 40 }}>Loading Plans...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {plans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>

            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.planName}>{plan.name}</Text>

                {plan.isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>Active Plan</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.radioButton} onPress={() => handlePlanSelect(plan.id)}>
                <View style={[styles.radioOuter, selectedPlan === plan.id && styles.radioSelected]}>
                  {selectedPlan === plan.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>{plan.price}</Text>
              {plan.duration && <Text style={styles.duration}> {plan.duration}</Text>}
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>{feature.icon}</View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>

          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#ccc" : "#4CAF50",
            padding: 15,
            borderRadius: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", textAlign: "center" }}>
              Continue
            </Text>
          )}
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  planCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: 'transparent' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  planTitleContainer: { flex: 1 },
  planName: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  recommendedBadge: { backgroundColor: '#E8F5E8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  recommendedText: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
  activeBadge: { backgroundColor: '#E8F5E8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  activeText: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
  radioButton: { padding: 4 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#4CAF50' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  price: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  duration: { fontSize: 14, color: '#666' },
  featuresContainer: { gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  featureIcon: { width: 24, height: 24, borderRadius: 16, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  featureText: { fontSize: 14, color: '#333', flex: 1 },
  bottomContainer: { padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  continueButton: { backgroundColor: '#4CAF50', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  continueButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', backgroundColor: 'white', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 12, color: '#666', marginTop: 4 },
});
