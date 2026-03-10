import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, User, FileText, MoreHorizontal, Package, Settings, UserPlus, CreditCard, Star, CircleHelp as HelpCircle, Share2, LogOut, RefreshCw, X } from 'lucide-react-native';
import { Appbar, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './components/AuthContext';
import ApiService from './components/ApiServices';
import RazorpayCheckout from 'react-native-razorpay';

const YOUR_RAZORPAY_KEY_ID = "rzp_test_RfcfxfJ2sIZdao"; // Move to env variable

export default function MoreScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [initialsLetter, setInitialsLetter] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  
  const {
    user,
    isAuthenticated,
    isSubscribed,
    subscription,
    refreshSubscription
  } = useContext(AuthContext);

  const fetchSubscriptionDetails = async () => {
    try {
      if (subscription?.id) {
        const response = await ApiService.get(`/subscriptions/${subscription.id}`);
        if (response.data) {
          setSubscriptionDetails(response.data.subscription);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      if (isSubscribed && subscription?.id) {
        fetchSubscriptionDetails();
      }
    }, [isSubscribed, subscription])
  );

  const fetchUserData = async () => {
    const userDetails = await AsyncStorage.getItem("userData");
    const rrr = JSON.parse(userDetails);
    setUserData(rrr);
    const name = rrr?.name?.trim() || '';
    const firstWord = name.split(' ')[0] || '';
    const initials = firstWord.charAt(0).toUpperCase();
    setInitialsLetter(initials);
  };

  const handleRenewalPress = () => {
    setShowRenewalModal(true);
  };

  const handleRenewSubscription = async () => {
    try {
      setRenewalLoading(true);

      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        Alert.alert("Error", "User not found");
        return;
      }
      const userDetails = JSON.parse(userData);

      if (!subscription) {
        Alert.alert("Error", "Subscription not found");
        return;
      }

      console.log("Creating renewal order for subscription:", subscription.id);

      // Create renewal order
      const response = await ApiService.post('/payment_rozarpay/renew-subscription', {
        subscription_id: subscription.id,
        user_id: user.id,
        subscriber_name: userDetails.name,
        subscriber_email: userDetails.email,
        subscriber_phone: userDetails.mobile
      });

      const data = response.data;
      if (!data.orderId) {
        Alert.alert("Error", "Unable to create renewal order");
        return;
      }

      // Close the modal
      setShowRenewalModal(false);

      // Razorpay options
      const options = {
        description: `Renew ${data.plan_name} Subscription`,
        image: "../assets/images/icon.png",
        currency: "INR",
        key: YOUR_RAZORPAY_KEY_ID,
        amount: data.amount,
        order_id: data.orderId,
        name: "Aqua Services",
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.mobile
        },
        theme: { color: "#0C8CE9" },
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
          console.log("Renewal Payment Result:", paymentResult);
          verifyRenewalPayment(options, paymentResult);
        })
        .catch(error => {
          console.log("Renewal Payment Error:", error);
          if (error.code === 2) {
            Alert.alert("Payment Cancelled", "You cancelled the renewal payment");
          } else {
            Alert.alert("Payment Failed", error.description || "Something went wrong");
          }
        });

    } catch (error) {
      console.error("Error creating renewal:", error);
      Alert.alert("Error", error.response?.data?.error || "Something went wrong");
    } finally {
      setRenewalLoading(false);
    }
  };

  const verifyRenewalPayment = async (options, paymentResult) => {
    try {
      const verificationData = {
        razorpay_order_id: options.order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature
      };

      console.log("Verifying renewal payment:", verificationData);

      const response = await ApiService.post('/payment_rozarpay/verify-renewal-payment', verificationData);

      if (response.data.success) {
        Alert.alert(
          "Success", 
          "Subscription renewed successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                refreshSubscription(); // Refresh subscription data
                router.push('/my-plan'); // Navigate to plan details
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", "Payment verification failed");
      }
    } catch (error) {
      console.error("Renewal verification error:", error);
      Alert.alert("Error", error.response?.data?.message || "Payment verification failed");
    }
  };

  const handleMyPlanPress = () => {
    router.push('/my-plan');
  };

  const handleItemPress = (item) => {
    if (item.onPress) {
      item.onPress();
    } else {
      console.log('Navigate to:', item.title);
    }
  };

  const handleEmployeesPress = () => {
    router.push('/subscription-members');
  };

  // Dynamic menu items based on subscription status
  const getBusinessMenuItems = () => {
    const businessItems = [
      { icon: <FileText size={20} color="#666" />, title: 'Bills', subtitle: 'Manage invoices and billing', onPress: () => router.push('/bills') },
      { icon: <Package size={20} color="#666" />, title: 'Stock Management', subtitle: 'Track inventory and stock levels', onPress: () => router.push('/items') },
    ];

    // Show either Plan or Renewal based on subscription status
    if (isSubscribed) {
      businessItems.push({ 
        icon: <RefreshCw size={20} color="#666" />, 
        title: 'Renew Subscription', 
        subtitle: subscriptionDetails ? 
          `Renew plan (Expires: ${new Date(subscriptionDetails.end_date).toLocaleDateString()})` : 
          'Renew your current plan',
        onPress: handleRenewalPress 
      });
    } else {
      businessItems.push({ 
        icon: <CreditCard size={20} color="#666" />, 
        title: 'My Plan', 
        subtitle: 'Subscribe to a plan and manage billing', 
        onPress: handleMyPlanPress 
      });
    }

    return businessItems;
  };

  const menuItems = [
    {
      section: 'Account',
      items: [
        { icon: <User size={20} color="#666" />, title: 'Account', subtitle: 'Profile settings and account details', onPress: () => router.push('/accounts') },
        { icon: <User size={20} color="#666" />, title: 'Profile', subtitle: 'Personal information and business details', onPress: () => router.push('/profile') },
      ]
    },
    {
      section: 'Business',
      items: getBusinessMenuItems()
    },
    {
      section: 'Support',
      items: [
        { icon: <HelpCircle size={20} color="#666" />, title: 'Help', subtitle: 'Get support and help center', onPress: () => router.push('/help') },
        { icon: <Star size={20} color="#666" />, title: 'Rate App', subtitle: 'Rate Aqua Credit on app store' },
        { icon: <Share2 size={20} color="#666" />, title: 'Share App', subtitle: 'Invite friends to use Aqua Credit' },
        { icon: <LogOut size={20} color="#666" />, title: 'LogOut', subtitle: 'Logout from your account', onPress: () => setShowLogoutModal(true) },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Avatar.Text label={initialsLetter} size={34} color='#ffffff' style={{ backgroundColor: '#2E7D32', marginStart: 8, padding: 0 }} />
        <Appbar.Content title="More Details" titleStyle={{ textAlign: 'center', fontWeight: 'bold' }} />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex !== section.items.length - 1 && styles.menuItemBorder
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.menuIcon}>
                    {item.icon}
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <View style={styles.menuArrow}>
                    <Text style={styles.arrowText}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Aqua Credit. All rights reserved.</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboard')}>
          <TrendingUp size={24} color="#4CAF50" />
          <Text style={styles.navText}>Ledger</Text>
        </TouchableOpacity>
        {isSubscribed && (
          <TouchableOpacity style={styles.navItem} onPress={handleEmployeesPress}>
            <UserPlus size={24} color="#4CAF50" />
            <Text style={styles.navText}>Employees</Text>
          </TouchableOpacity>
        )}
        {!isSubscribed && (
          <TouchableOpacity style={styles.navItem} onPress={handleMyPlanPress}>
            <CreditCard size={24} color="#666" />
            <Text style={styles.navText}>My Plan</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.navItem}>
          <MoreHorizontal size={24} color="#666" />
          <Text style={styles.navText}>More</Text>
        </TouchableOpacity>
      </View>

      {/* Renewal Confirmation Modal - Normal Modal */}
      <Modal
        visible={showRenewalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRenewalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.renewalModalContainer}>
            <View style={styles.renewalModalHeader}>
              <Text style={styles.renewalModalTitle}>Renew Subscription</Text>
              <TouchableOpacity onPress={() => setShowRenewalModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.renewalModalContent}>
              <Text style={styles.renewalModalText}>
                Are you sure you want to renew your subscription?
              </Text>
              
              {subscriptionDetails && (
                <View style={styles.renewalDetailsContainer}>
                  <View style={styles.renewalDetailRow}>
                    <Text style={styles.renewalDetailLabel}>Current Plan:</Text>
                    <Text style={styles.renewalDetailValue}>{subscriptionDetails.plan_name}</Text>
                  </View>
                  <View style={styles.renewalDetailRow}>
                    <Text style={styles.renewalDetailLabel}>Expires on:</Text>
                    <Text style={styles.renewalDetailValue}>
                      {new Date(subscriptionDetails.end_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.renewalDetailRow}>
                    <Text style={styles.renewalDetailLabel}>Amount:</Text>
                    <Text style={styles.renewalDetailValue}>₹{subscriptionDetails.total_price}</Text>
                  </View>
                </View>
              )}

              <View style={styles.renewalButtonRow}>
                <TouchableOpacity
                  style={[styles.renewalButton, styles.renewalCancelButton]}
                  onPress={() => setShowRenewalModal(false)}
                >
                  <Text style={styles.renewalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.renewalButton, styles.renewalConfirmButton]}
                  onPress={handleRenewSubscription}
                  disabled={renewalLoading}
                >
                  {renewalLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.renewalConfirmButtonText}>Renew Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#cccccc' }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.buttonText, { color: '#333' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#E53935' }]}
                onPress={() => {
                  setShowLogoutModal(false);
                  router.replace('/login');
                }}
              >
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  menuArrow: {
    padding: 4,
  },
  arrowText: {
    fontSize: 18,
    color: '#CCC',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Renewal Modal Specific Styles
  renewalModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
  },
  renewalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  renewalModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  renewalModalContent: {
    padding: 20,
  },
  renewalModalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  renewalDetailsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  renewalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  renewalDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  renewalDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  renewalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  renewalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  renewalCancelButton: {
    backgroundColor: '#E0E0E0',
  },
  renewalCancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  renewalConfirmButton: {
    backgroundColor: '#4CAF50',
  },
  renewalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});